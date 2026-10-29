// 测试：语文多解填空 —— ①备选答案判对 ②「算我对」撤销误判 ③交卷后逐题改判 ④错题本改判
// 用法：node test_softgrade.mjs <BASE>   例：http://127.0.0.1:8897/chinese-g3up/out/
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9381;
const BASE = process.argv[2] || "http://127.0.0.1:8897/chinese-g3up/out/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "softgr-"));
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
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("studyfree.session.v1", JSON.stringify({name:"测试甲",ts:Date.now()}))}catch(e){}` });

async function nav(u) { await send("Page.navigate", { url: u }); await sleep(2400); }
async function ev(e) {
  const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return "ERR:" + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
}
let pass = 0, fail = 0;
const chk = (n, c, d) => { if (c) { pass++; console.log("  PASS " + n); } else { fail++; console.log("  FAIL " + n + (d !== undefined ? " → " + d : "")); } };
const WB = `JSON.parse(localStorage.getItem("chinese3.wrongbook.v1.测试甲")||"{}")`;

/* ── 1. 备选答案判对 ── */
await nav(BASE + "u1.html");
/* 进入第 1 个知识点（含「春风走进花园」那道仿写题） */
await ev(`document.querySelector('#snav .ssub .s2[data-nav="kp0"]').click()`);
await sleep(400);
const got1 = await ev(`(function(){
  var qs=[].slice.call(document.querySelectorAll("#kps .q"));
  for(var i=0;i<qs.length;i++){
    if(qs[i].textContent.indexOf("春风走进花园")>-1){
      var inp=qs[i].querySelector("input");
      if(!inp) return "NOINPUT";
      inp.value="嬉戏";                    /* 备选答案之一 */
      qs[i].querySelector(".btn").click();
      return qs[i].querySelector(".fb").textContent;
    }
  }
  return "NOQ";
})()`);
chk("备选答案「嬉戏」判为答对", String(got1).includes("答对了"), got1);

/* ── 2. 「算我对」撤销误判 ── */
const got2 = await ev(`(function(){
  var arr=[].slice.call(document.querySelectorAll("#kps .q"));
  for(var i=0;i<arr.length;i++){
    var q=arr[i], inp=q.querySelector("input");
    if(!inp || inp.disabled) continue;
    inp.value="我随便写的词";
    q.querySelector(".btn").click();
    var fb=q.querySelector(".fb");
    var fix=q.querySelector(".fixbtn");
    return JSON.stringify({fb:fb.textContent.slice(0,20), hasFix:!!fix});
  }
  return "NOQ";
})()`);
let s2 = {};
try { s2 = JSON.parse(got2); } catch (e) { s2 = {}; }
chk("系统外答案判错并出现「算我对」按钮", s2.hasFix === true, got2);

/* 错题本此刻应新增 2 条（原题 + 变式）；点「算我对」后应撤销 */
const wbBefore = await ev(`Object.keys(${WB}).length`);
const fixRes = await ev(`(function(){
  var arr=[].slice.call(document.querySelectorAll("#kps .q"));
  for(var i=0;i<arr.length;i++){
    var q=arr[i], fb=q.querySelector(".fb");
    if(fb && fb.className.indexOf("no")>-1){
      var b=q.querySelector(".fixbtn");
      if(!b) return "NOBTN";
      b.click();
      return JSON.stringify({cls:fb.className, txt:fb.textContent.slice(0,24)});
    }
  }
  return "NOFAILQ";
})()`);
let fr = {};
try { fr = JSON.parse(fixRes); } catch (e) { fr = {}; }
chk("点击后反馈转绿并提示已算对", String(fr.cls || "").includes("ok") && String(fr.txt || "").includes("已算对"), fixRes);

const wbAfter = await ev(`Object.keys(${WB}).length`);
chk("撤销后错题本回到原条数", wbAfter === wbBefore - 2, wbBefore + " → " + wbAfter);

/* ── 3. 自测交卷后逐题改判 ── */
await nav(BASE + "u1.html");
await ev(`document.querySelector('#snav .ssub .s2[data-nav="exam"]').click()`);
await sleep(400);
await ev(`document.getElementById("examStart").click()`);
await sleep(600);
/* 全部填空填系统外答案，选择/判断点非正确项 → 必错 */
const answered = await ev(`(function(){
  var qs=[].slice.call(document.querySelectorAll("#pane-exam .q"));
  var n=0;
  qs.forEach(function(q){
    var inp=q.querySelector("input");
    if(inp){ inp.value="错误答案"; inp.dispatchEvent(new Event("input")); n++; return; }
    var opts=q.querySelectorAll(".opt");
    if(opts.length){
      var ans=q.getAttribute("data-ans");
      for(var i=0;i<opts.length;i++){
        if(opts[i].getAttribute("data-val")!==ans){ opts[i].click(); n++; break; }
      }
    }
  });
  return n;
})()`);
await sleep(400);
await ev(`document.getElementById("examSubmit").click()`);
await sleep(700);
const beforeFix = await ev(`(function(){
  var sc=document.querySelector("#examResult .sc");
  var b=document.querySelector("#examResult [data-fix]");
  return JSON.stringify({sc:sc?sc.textContent:"", hasFixBtn:!!b, rows:document.querySelectorAll("#examResult .wrow").length});
})()`);
let bf = {};
try { bf = JSON.parse(beforeFix); } catch (e) { bf = {}; }
chk("交卷后有错题且出现「算对这题」按钮", bf.hasFixBtn === true && Number(bf.rows) > 0, beforeFix);

const afterFix = await ev(`(function(){
  var b=document.querySelector("#examResult [data-fix]");
  if(!b) return "NOBTN";
  b.click();
  var sc=document.querySelector("#examResult .sc");
  var rows=document.querySelectorAll("#examResult .wrow").length;
  return JSON.stringify({sc:sc?sc.textContent:"", rows:rows});
})()`);
let af = {};
try { af = JSON.parse(afterFix); } catch (e) { af = {}; }
chk("改判后分数变化", bf.sc !== af.sc, bf.sc + " → " + af.sc);
chk("改判后错题行减少", Number(af.rows) === Number(bf.rows) - 1, bf.rows + " → " + af.rows);

/* ── 4. 错题本复习改判 ── */
await nav(BASE + "review.html");
const revCount = await ev(`document.querySelectorAll(".q").length`);
const revFix = await ev(`(function(){
  var cards=[].slice.call(document.querySelectorAll(".q"));
  for(var i=0;i<cards.length;i++){
    var c=cards[i];
    var inp=c.querySelector("input");
    if(!inp || inp.disabled) continue;
    inp.value="完全不对的答案";
    var btn=c.querySelector(".btn");
    if(!btn) continue;
    btn.click();
    var fix=c.querySelector(".fixbtn");
    if(!fix) return "NOFIX";
    fix.click();
    var fb=c.querySelector(".fb");
    return JSON.stringify({fb:fb?fb.textContent.slice(0,20):"", cls:fb?fb.className:""});
  }
  return "NOCARD";
})()`);
let rf = {};
try { rf = JSON.parse(revFix); } catch (e) { rf = {}; }
chk("错题本填错后出现「算我对」且可改判", String(rf.fb || "").includes("已算对"), revFix + " | 卡片数 " + revCount);

console.log("\n结果：" + pass + " 过，" + fail + " 败");
ws.close(); proc.kill(); process.exit(fail ? 1 : 0);
