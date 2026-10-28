// 通用变式题验证：答错 3 道题 → 错题本应有 3 条原错题 + 3 道变式题
// 用法：node test_variant.mjs <BASE>   例：http://127.0.0.1:8899/
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9360;
const BASE = process.argv[2] || "http://127.0.0.1:8899/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "vv-"));
const proc = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox",
  `--remote-debugging-port=${DBG}`, `--user-data-dir=${udd}`, "about:blank"], { stdio: "ignore" });
await sleep(2200);

const list = JSON.parse(await get(`http://127.0.0.1:${DBG}/json/list`));
const page = list.find(t => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 64 * 1024 * 1024 });
await new Promise(r => ws.on("open", r));
let seq = 0; const pending = new Map();
const send = (m, p = {}) => new Promise(r => { const i = ++seq; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.on("message", raw => { let m; try { m = JSON.parse(raw); } catch { return; } if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); } });
await send("Page.enable"); await send("Runtime.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("studyfree.session.v1", JSON.stringify({name:"\u6d4b\u8bd5\u7532",ts:Date.now()}))}catch(e){}` });
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

async function nav(u) { await send("Page.navigate", { url: u }); await sleep(2300); }
async function ev(e) {
  const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return "ERR:" + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
}

await nav(BASE + "u1.html");
await ev(`localStorage.clear()`);
await nav(BASE + "u1.html");

/* 故意答错前 3 道选择题（kp 区的即时判分题） */
const wrong = await ev(`(function(){
  var n=0;
  var qs=document.querySelectorAll("#kps .q");
  for(var i=0;i<qs.length && n<3;i++){
    var q=qs[i], opts=q.querySelectorAll(".opt");
    if(!opts.length) continue;
    var ans=q.getAttribute("data-ans");
    for(var j=0;j<opts.length;j++){
      if(opts[j].getAttribute("data-val")!==ans){ opts[j].click(); n++; break; }
    }
  }
  return n;
})()`);
await sleep(500);

const wbRaw = await ev(`(function(){
  for(var i=0;i<localStorage.length;i++){
    var k=localStorage.key(i);
    if(k.indexOf("wrongbook")>-1) return localStorage.getItem(k);
  }
  return "{}";
})()`);
const wb = JSON.parse(wbRaw || "{}");
const keys = Object.keys(wb);
const orig = keys.filter(k => !k.endsWith("_v")).length;
const gen = keys.filter(k => k.endsWith("_v")).length;

const ok = wrong >= 3 && orig >= 3 && gen >= 3;
console.log((ok ? "PASS" : "FAIL") + ` 答错 ${wrong} 题 → 原错题 ${orig} 条，变式题 ${gen} 道`);
console.log(ok ? "结果：通过" : "结果：不通过");

ws.close(); proc.kill();
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(ok ? 0 : 1);
