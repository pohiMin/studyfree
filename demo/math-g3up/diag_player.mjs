// 直接以播放器页为主页面，检查 video 元素的真实状态
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9335;
const target = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "cdp3-"));
const proc = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox", "--mute-audio",
  "--autoplay-policy=no-user-gesture-required",
  `--remote-debugging-port=${DBG}`, `--user-data-dir=${udd}`, "about:blank"], { stdio: "ignore" });
await sleep(2200);

const list = JSON.parse(await get(`http://127.0.0.1:${DBG}/json/list`));
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 64 * 1024 * 1024 });
await new Promise((r) => ws.on("open", r));

let seq = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((r) => { const i = ++seq; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const logs = [], fails = [];
ws.on("message", (raw) => {
  let m; try { m = JSON.parse(raw); } catch { return; }
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); return; }
  const p = m.params || {};
  if (m.method === "Log.entryAdded" && p.entry) logs.push(`[${p.entry.level}] ${(p.entry.text||"").slice(0,140)}`);
  if (m.method === "Network.loadingFailed") fails.push(`${p.type} ${p.errorText}`);
  if (m.method === "Network.responseReceived" && p.response?.status >= 400) fails.push(`${p.response.status} ${String(p.response.url).slice(0,80)}`);
});

await send("Page.enable"); await send("Runtime.enable");
await send("Log.enable"); await send("Network.enable");
await send("Page.navigate", { url: target });
await sleep(11000);

const r = await send("Runtime.evaluate", {
  expression: `JSON.stringify({
    href: location.href.slice(0,80),
    title: document.title,
    text: (document.body?document.body.innerText:"").replace(/\\s+/g," ").slice(0,320),
    videos: Array.from(document.querySelectorAll("video")).map(function(v){
      return {rs:v.readyState, w:v.videoWidth, h:v.videoHeight, paused:v.paused, err:v.error?v.error.code:0,
              src:(v.currentSrc||v.src||"").slice(0,60)};
    }),
    canvas: document.querySelectorAll("canvas").length
  })`, returnByValue: true,
});

console.log("=== 播放器页 ===", target.slice(0, 90));
console.log("结果:", r?.result?.value ?? JSON.stringify(r).slice(0, 200));
console.log("\n=== 网络失败 ===");
console.log(fails.length ? fails.slice(0, 8).map((x) => "  " + x).join("\n") : "  （无）");
console.log("\n=== 日志 ===");
console.log(logs.length ? logs.slice(0, 8).map((x) => "  " + x).join("\n") : "  （无）");

ws.close(); proc.kill();
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(0);
