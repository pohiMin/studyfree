// 测试：基础题作答持久化 —— 答过的题刷新后保留状态与进度、重置后清空、换使用者隔离
// 用法：node test_persist.mjs <BASE>   例：http://127.0.0.1:8897/chinese-g3up/out/
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9396;
const BASE = process.argv[2] || "http://127.0.0.1:8897/chinese-g3up/out/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "persist-"));
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
/* 种登录态 + 自动放行 confirm */
/* 只在没有登录态时种「测试甲」——否则第 4 步切到乙会被每页重置回甲 */
await send("Page.addScriptToEvaluateOnNewDocument", { source: `try{ if(!localStorage.getItem("studyfree.session.v1")) localStorage.setItem("studyfree.session.v1", JSON.stringify({name:"测试甲",ts:Date.now()})); }catch(e){} window.confirm=()=>true;` });

async function nav(u) { await send("Page.navigate", { url: u }); await sleep(2400); }
async function ev(e) {
  const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return "ERR:" + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
}
let pass = 0, fail = 0;
const chk = (n, c, d) => { if (c) { pass++; console.log("  PASS " + n); } else { fail++; console.log("  FAIL " + n + (d !== undefined ? " → " + d : "")); } };

const progress = () => ev(`document.getElementById("ptxt").textContent.replace(/\\s+/g," ").trim()`);

/* ── 1. 答一题对、一题错 ── */
await nav(BASE + "u1.html");
await ev(`localStorage.removeItem("chinese3.done.v1.测试甲"); localStorage.removeItem("chinese3.wrongbook.v1.测试甲");`);
await nav(BASE + "u1.html");
const ansInfo = await ev(`(function(){
  var arr=[].slice.call(document.querySelectorAll("#kps .q"));
  var filled=0, res={};
  for(var i=0;i<arr.length;i++){
    var q=arr[i], inp=q.querySelector("input");
    if(!inp || inp.disabled) continue;
    var right=(q.getAttribute("data-ans")||"").split("|")[0];
    inp.value = filled===0 ? right : "完全不搭的答案zzz";
    q.querySelector(".btn").click();
    filled++;
    if(filled>=2) break;
  }
  return JSON.stringify({filled:filled});
})()`);
let ai = {}; try { ai = JSON.parse(ansInfo); } catch (e) {}
chk("已作答两题（一题对、一题错）", ai.filled === 2, ansInfo);
const p1 = await progress();
chk("进度显示为 2 题", /已完成\s*2\s*\//.test(String(p1)), p1);

/* ── 2. 刷新后：状态与进度保留 ── */
await nav(BASE + "u1.html");
const p2 = await progress();
chk("刷新后进度保留（不为 0）", /已完成\s*2\s*\//.test(String(p2)), p2);
const keep = await ev(`(function(){
  var arr=[].slice.call(document.querySelectorAll("#kps .q"));
  var done=0, disabled=0, withVal=0, fix=0, okFb=0;
  for(var i=0;i<arr.length;i++){
    var q=arr[i], inp=q.querySelector("input");
    if(!inp) continue;
    if(inp.disabled){ disabled++; if(inp.value) withVal++; }
    var fb=q.querySelector(".fb");
    if(fb && fb.className.indexOf(" show ok")>-1) { okFb++; done++; }
    if(q.querySelector(".fixbtn")) fix++;
  }
  return JSON.stringify({disabled:disabled, withVal:withVal, okFb:okFb, fix:fix});
})()`);
let kp = {}; try { kp = JSON.parse(keep); } catch (e) {}
chk("答过的填空已禁用", Number(kp.disabled) >= 2, keep);
chk("答案内容保留在输入框", Number(kp.withVal) >= 2, keep);
chk("答对的题恢复为绿色答对态", Number(kp.okFb) >= 1, keep);
chk("答错的题仍可「算我对」", Number(kp.fix) >= 1, keep);

/* ── 3. 重置本页 → 清空且刷新后仍为空 ── */
await ev(`document.getElementById("reset").click()`);
await sleep(500);
const p3 = await progress();
chk("重置后进度归零", /已完成\s*0\s*\//.test(String(p3)), p3);
await nav(BASE + "u1.html");
const p4 = await progress();
chk("刷新后仍为空（重置已持久化）", /已完成\s*0\s*\//.test(String(p4)), p4);

/* ── 4. 换使用者隔离 ── */
await nav(BASE + "u1.html");
await ev(`(function(){
  var arr=[].slice.call(document.querySelectorAll("#kps .q"));
  for(var i=0;i<arr.length;i++){
    var q=arr[i], inp=q.querySelector("input");
    if(!inp || inp.disabled) continue;
    inp.value=(q.getAttribute("data-ans")||"").split("|")[0];
    q.querySelector(".btn").click();
    return 1;
  }
  return 0;
})()`);
await sleep(300);
const pA = await progress();
await ev(`localStorage.setItem("studyfree.session.v1", JSON.stringify({name:"测试乙",ts:Date.now()}))`);
await nav(BASE + "u1.html");
const pB = await progress();
chk("甲有作答记录", /已完成\s*1\s*\//.test(String(pA)), pA);
chk("换使用者乙后进度为 0（互相隔离）", /已完成\s*0\s*\//.test(String(pB)), pB);

console.log("\n结果：" + pass + " 过，" + fail + " 败");
ws.close(); proc.kill(); process.exit(fail ? 1 : 0);
