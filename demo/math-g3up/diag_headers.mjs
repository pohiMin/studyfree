// 抓浏览器实际收到的响应头，重点看 x-frame-options / CSP frame-ancestors
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9336;
const target = process.argv[2] || "file:///C:/Users/10061/WorkBuddy/studyfree/demo/math-g3up/out/u1.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "cdph-"));
const proc = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox", "--mute-audio",
  `--remote-debugging-port=${DBG}`, `--user-data-dir=${udd}`, "about:blank"], { stdio: "ignore" });
await sleep(2200);

const list = JSON.parse(await get(`http://127.0.0.1:${DBG}/json/list`));
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 64 * 1024 * 1024 });
await new Promise((r) => ws.on("open", r));

let seq = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++seq; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });

const hits = [], fails = [], logs = [];
ws.on("message", (raw) => {
  let m; try { m = JSON.parse(raw); } catch { return; }
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); return; }
  const p = m.params || {};
  if (m.method === "Network.responseReceived") {
    const r = p.response || {};
    if (/bilibili/.test(r.url || "")) hits.push({ url: r.url, status: r.status, h: r.headers || {} });
  }
  if (m.method === "Network.requestWillBeSent" && /bilibili/.test(p.request?.url || "")) {
    hits.push({ req: p.request.url, h: p.request.headers || {} });
  }
  if (m.method === "Network.loadingFailed") fails.push(`${p.type} ${p.errorText} blocked=${p.blockedReason || "-"}`);
  if (m.method === "Log.entryAdded" && p.entry) logs.push(`[${p.entry.level}] ${(p.entry.text||"").slice(0,220)}`);
});

await send("Page.enable"); await send("Network.enable"); await send("Log.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: target });
await sleep(12000);

console.log("=== 目标页 ===", target.slice(0, 80));
console.log("\n=== 与 bilibili 的交互（浏览器实际看到的）===");
if (!hits.length) console.log("  （没有发生任何 bilibili 请求）");
hits.slice(0, 8).forEach((x) => {
  if (x.req) {
    console.log(`  请求: ${String(x.req).slice(0, 90)}`);
  } else {
    console.log(`  响应: ${x.status} ${String(x.url).slice(0, 90)}`);
    for (const k of Object.keys(x.h)) {
      if (/frame|content-security|origin|referer|policy/i.test(k)) console.log(`      ${k}: ${String(x.h[k]).slice(0, 160)}`);
    }
  }
});

console.log("\n=== 被阻止的请求 ===");
console.log(fails.length ? fails.slice(0, 10).map((x) => "  " + x).join("\n") : "  （无）");

console.log("\n=== 浏览器日志（可能含拦截原因）===");
const rel = logs.filter((l) => /frame|block|refus|denied|阻止|X-Frame|csp/i.test(l));
console.log(rel.length ? rel.slice(0, 8).map((x) => "  " + x).join("\n") : "  （无相关条目）");

ws.close(); proc.kill();
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(0);
