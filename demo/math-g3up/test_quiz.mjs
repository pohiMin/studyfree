// 测试：侧栏折叠 / 视频折叠 / 限时测验 / 星星评级 / 变式题
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9338;
const BASE = process.argv[2] || "http://127.0.0.1:8899/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "qz-"));
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
await send("Emulation.setDeviceMetricsOverride", {width:1440,height:900,deviceScaleFactor:1,mobile:false});

async function nav(u) { await send("Page.navigate", { url: u }); await sleep(2400); }
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

// 1. 侧栏折叠
let w0 = await ev(`document.querySelector(".side").offsetWidth`);
await ev(`document.getElementById("sideToggle").click()`);
await sleep(400);
let w1 = await ev(`document.querySelector(".side").offsetWidth`);
await ev(`document.getElementById("sideToggle").click()`);
await sleep(400);
let w2 = await ev(`document.querySelector(".side").offsetWidth`);
chk("侧栏可收起", w0 > 200 && w1 === 0 && w2 > 200, `${w0} → ${w1} → ${w2}`);

// 2. 视频折叠
const vh0 = await ev(`document.getElementById("vlist").classList.contains("hide")`);
await ev(`document.getElementById("vhead").click()`);
await sleep(300);
const vh1 = await ev(`document.getElementById("vlist").classList.contains("hide")`);
chk("默认收起，点击展开", vh0 === true && vh1 === false, `${vh0} → ${vh1}`);

// 3. 左栏固定 / 右栏可滚动
const stick = await ev(`getComputedStyle(document.querySelector(".kp-left")).position`);
const ovf = await ev(`getComputedStyle(document.querySelector(".kp-right")).overflowY`);
chk("左侧固定、右侧独立滚动", stick === "sticky" && ovf === "auto", `${stick} / ${ovf}`);

// 4. 进入随堂自测
await ev(`document.querySelector('#snav .ssub .s2[data-nav="exam"]').click()`);
await sleep(400);
const hasStart = await ev(`!!document.getElementById("examStart")`);
chk("有开始按钮", hasStart === true);
const qBefore = await ev(`document.querySelectorAll("#pane-exam .q").length`);
chk("开始前不显示题目", qBefore === 0, qBefore + " 题");

await ev(`document.getElementById("examStart").click()`);
await sleep(600);
const qAfter = await ev(`document.querySelectorAll("#pane-exam .q").length`);
const tmShown = await ev(`document.getElementById("examTm").style.display !== "none"`);
const tmText = await ev(`document.getElementById("examTm").textContent`);
chk("开始后题目出现", qAfter > 0, qAfter + " 题");
chk("倒计时启动", tmShown === true, tmText);

// 5. 全部故意答错，然后交卷
await ev(`(function(){
  document.querySelectorAll("#pane-exam .q").forEach(function(q){
    var ans=(q.getAttribute("data-ans")||"").split("|")[0];
    var opts=q.querySelectorAll(".opt");
    if(opts.length){
      for(var i=0;i<opts.length;i++){ if(opts[i].getAttribute("data-val")!==ans){ opts[i].click(); return; } }
    } else {
      var ip=q.querySelector("input");
      if(ip){ ip.value="99999"; ip.dispatchEvent(new Event("input")); }
    }
  });
  return 1;
})()`);
await sleep(500);
await ev(`document.getElementById("examSubmit").click()`);
await sleep(1200);

const hasResult = await ev(`!!document.querySelector("#examResult .result")`);
const scText = await ev(`(document.querySelector("#examResult .sc")||{}).textContent || ""`);
const starOn = await ev(`document.querySelectorAll("#examResult .star.on").length`);
const wrongRows = await ev(`document.querySelectorAll("#examResult .wrow").length`);
chk("交卷后出成绩", hasResult === true, scText);
chk("全错得 1 星", starOn === 1, starOn + " 星");
chk("列出错题分析", wrongRows > 0, wrongRows + " 行");

// 6. 错题本：原错题 + 变式题
const wbRaw = await ev(`localStorage.getItem("math3.wrongbook.v1.测试甲")`);
const wbObj = wbRaw ? JSON.parse(wbRaw) : {};
const keys = Object.keys(wbObj);
const genCount = keys.filter(k => k.endsWith("_v")).length;
chk("错题写入易错本", keys.length > 0, keys.length + " 条");
chk("自动生成变式题", genCount > 0, genCount + " 道变式");

await nav(BASE + "review.html");
const revQ = await ev(`document.querySelectorAll("#list .q").length`);
const revGen = await ev(`document.querySelectorAll("#list .vgen").length`);
chk("错题本显示题目", revQ > 0, revQ + " 题");
chk("变式题有标记", revGen > 0, revGen + " 道");

// 7. 全对 → 3 星
await nav(BASE + "u1.html");
await ev(`localStorage.clear()`);
await nav(BASE + "u1.html");
await ev(`document.querySelector('#snav .ssub .s2[data-nav="exam"]').click()`);
await sleep(300);
await ev(`document.getElementById("examStart").click()`);
await sleep(600);
await ev(`(function(){
  document.querySelectorAll("#pane-exam .q").forEach(function(q){
    var ans=(q.getAttribute("data-ans")||"").split("|")[0];
    var opts=q.querySelectorAll(".opt");
    if(opts.length){
      for(var i=0;i<opts.length;i++){ if(opts[i].getAttribute("data-val")===ans){ opts[i].click(); return; } }
    } else {
      var ip=q.querySelector("input");
      if(ip){ ip.value=ans; ip.dispatchEvent(new Event("input")); }
    }
  });
  return 1;
})()`);
await sleep(400);
await ev(`document.getElementById("examSubmit").click()`);
await sleep(1200);
const starOn2 = await ev(`document.querySelectorAll("#examResult .star.on").length`);
const wrongRows2 = await ev(`document.querySelectorAll("#examResult .wrow").length`);
chk("全对得 3 星", starOn2 === 3, starOn2 + " 星");
chk("全对无错题", wrongRows2 === 0, wrongRows2 + " 行");

console.log(log.join("\n"));
console.log("\n结果：", log.every(x => x.startsWith("PASS")) ? "全部通过" : "存在失败项");

ws.close(); proc.kill();
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(0);
