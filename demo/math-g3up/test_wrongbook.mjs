// 易错题本端到端测试：答错入库（含变式题）→ 连对 3 次移出
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9337;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, (r) => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "wbt-"));
const proc = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox",
  `--remote-debugging-port=${DBG}`, `--user-data-dir=${udd}`, "about:blank"], { stdio: "ignore" });
await sleep(2200);

const list = JSON.parse(await get(`http://127.0.0.1:${DBG}/json/list`));
const page = list.find(t => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 64 * 1024 * 1024 });
await new Promise(r => ws.on("open", r));

let seq = 0; const pending = new Map();
const send = (m, p = {}) => new Promise(r => { const i = ++seq; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.on("message", raw => {
  let m; try { m = JSON.parse(raw); } catch { return; }
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); }
});

await send("Page.enable"); await send("Runtime.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("studyfree.session.v1", JSON.stringify({name:"\u6d4b\u8bd5\u7532",ts:Date.now()}))}catch(e){}` });
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

async function nav(url) {
  await send("Page.navigate", { url });
  await sleep(2200);
}
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return "ERR: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
}

const BASE = process.argv[2] || "http://127.0.0.1:8899/";
const log = [];
function chk(name, cond, extra) { log.push((cond ? "PASS " : "FAIL ") + name + (extra !== undefined ? " → " + extra : "")); }

const ANSWER_ALL_RIGHT = `(function(){
  var n=0;
  [].forEach.call(document.querySelectorAll("#list .q"), function(q){
    var ans=q.dataset.ans, opts=q.querySelectorAll(".opt");
    if(opts.length){
      for(var j=0;j<opts.length;j++){ if(opts[j].dataset.val===ans){ opts[j].click(); n++; break; } }
    } else {
      var ip=q.querySelector("input"), b=q.querySelector(".btn");
      if(ip && b){ ip.value=ans; b.click(); n++; }
    }
  });
  return n;
})()`;

// 1. 单元页答错一题 → 原题 + 自动生成的变式题
await nav(BASE + "u1.html");
await ev(`localStorage.clear()`);
await nav(BASE + "u1.html");
await ev(`(function(){
  var q=document.querySelectorAll(".q")[0];
  var bad=null;
  q.querySelectorAll(".opt").forEach(function(o){ if(o.dataset.val!==q.dataset.ans && !bad) bad=o; });
  bad.click(); return 1;
})()`);
await sleep(400);
let obj = JSON.parse(await ev(`localStorage.getItem("math3.wrongbook.v1.测试甲")`) || "{}");
let keys = Object.keys(obj);
const genKeys = keys.filter(k => k.endsWith("_v"));
chk("答错后入库（原题 + 变式）", keys.length === 2 && genKeys.length === 1, keys.length + " 条，其中变式 " + genKeys.length);

// 2. 错题本页面应出现这两道题
await nav(BASE + "review.html");
let cnt = await ev(`document.querySelectorAll("#list .q").length`);
const genMark = await ev(`document.querySelectorAll("#list .vgen").length`);
chk("错题本显示两道题", cnt === 2, cnt + " 题");
chk("变式题有标记", genMark === 1, genMark + " 道");
const st0 = await ev(`document.querySelector("#list .streak .cnt").textContent`);
chk("初始连对为 0", /0|还未/.test(st0 || ""), st0);

// 3. 连续答对 3 次（每次刷新页面模拟一次练习），每轮答完所有题
for (let i = 1; i <= 3; i++) {
  await nav(BASE + "review.html");
  const answered = await ev(ANSWER_ALL_RIGHT);
  await sleep(500);
  const o = JSON.parse(await ev(`localStorage.getItem("math3.wrongbook.v1.测试甲")`) || "{}");
  const k = Object.keys(o);
  const streaks = k.map(x => o[x].streak);
  const ok = k.length === 0 || streaks.every(s => s === i);
  chk("第 " + i + " 轮：答 " + answered + " 题，剩 " + k.length + " 条", ok,
      k.length ? "streak=" + JSON.stringify(streaks) : "全部移出");
}

// 4. 再打开应显示空状态
await nav(BASE + "review.html");
const emptyTxt = await ev(`(document.getElementById("emptyBox").textContent||"").trim().slice(0,20)`);
chk("移出后显示空状态", /没有待攻克/.test(emptyTxt || ""), emptyTxt);
const finalCnt = await ev(`document.querySelectorAll("#list .q").length`);
chk("列表中已无题目", finalCnt === 0, finalCnt + " 题");

// 5. 期中卷：点开始后出卷面
await nav(BASE + "midterm.html");
chk("期中页无单元子项", (await ev(`document.querySelectorAll("#snav .ssub .s2").length`)) === 0);
await ev(`document.getElementById("paperStart").click()`);
await sleep(600);
const midQ = await ev(`document.querySelectorAll("#pane-paper .q").length`);
const midSec = await ev(`document.querySelectorAll(".paper-sec").length`);
chk("期中卷题数 34", midQ === 34, midQ + " 题");
chk("期中卷 5 个大题", midSec === 5, midSec + " 个");

console.log(log.join("\n"));
console.log("\n结果：", log.every(x => x.startsWith("PASS")) ? "全部通过" : "存在失败项");

ws.close(); proc.kill();
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(0);
