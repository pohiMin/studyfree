// 测试：英语填空判分的大小写与撇号容差
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9351;
const BASE = process.argv[2] || "http://127.0.0.1:8899/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "en-"));
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
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

async function nav(u) { await send("Page.navigate", { url: u }); await sleep(2300); }
async function ev(e) {
  const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return "ERR:" + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
}
const log = [];
const chk = (n, c, x) => log.push((c ? "PASS " : "FAIL ") + n + (x !== undefined ? " → " + x : ""));

await nav(BASE + "u1.html");
await ev(`localStorage.clear()`);
await nav(BASE + "u1.html");

// 找一个答案为 I'm 的填空题，分别用不同写法输入，检查反馈
const variants = [["标准 I'm", "I'm"], ["小写 im", "im"], ["大写 I'M", "I'M"]];
for (const [label, val] of variants) {
  await nav(BASE + "u1.html");
  const res = await ev(`(function(){
    var qs=document.querySelectorAll("#kps .q");
    for(var i=0;i<qs.length;i++){
      var q=qs[i], ip=q.querySelector("input");
      if(ip && (q.dataset.ans||"").toLowerCase().replace(/['\\u2019]/g,"")==="im"){
        ip.value=${JSON.stringify(val)};
        q.querySelector(".btn").click();
        var t=q.querySelector(".fb").textContent;
        return t.indexOf("答对了")>-1 ? "RIGHT" : "WRONG";
      }
    }
    return "NOTFOUND";
  })()`);
  chk(label + " 判对", res === "RIGHT", res);
}

// 英文单词大小写容差：name / NAME
await nav(BASE + "u1.html");
const res2 = await ev(`(function(){
  var qs=document.querySelectorAll("#kps .q");
  for(var i=0;i<qs.length;i++){
    var q=qs[i], ip=q.querySelector("input");
    if(ip && (q.dataset.ans||"").toLowerCase()==="name"){
      ip.value="NAME";
      q.querySelector(".btn").click();
      var t=q.querySelector(".fb").textContent;
      return t.indexOf("答对了")>-1 ? "RIGHT" : "WRONG";
    }
  }
  return "NOTFOUND";
})()`);
chk("全大写 NAME 判对", res2 === "RIGHT", res2);

// 错的答案仍判错
await nav(BASE + "u1.html");
const res3 = await ev(`(function(){
  var qs=document.querySelectorAll("#kps .q");
  for(var i=0;i<qs.length;i++){
    var q=qs[i], ip=q.querySelector("input");
    if(ip && (q.dataset.ans||"").toLowerCase()==="name"){
      ip.value="nema";
      q.querySelector(".btn").click();
      var t=q.querySelector(".fb").textContent;
      return t.indexOf("再想想")>-1 ? "WRONG-OK" : "BAD";
    }
  }
  return "NOTFOUND";
})()`);
chk("错拼写仍判错", res3 === "WRONG-OK", res3);

console.log(log.join("\n"));
console.log("\n结果：", log.every(x => x.startsWith("PASS")) ? "全部通过" : "存在失败项");
ws.close(); proc.kill();
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(0);
