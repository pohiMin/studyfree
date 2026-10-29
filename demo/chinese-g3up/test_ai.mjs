// 测试：AI 复核（本机 Key 模式）
// 覆盖：未配置不请求 / 复核命中自动改判 / AI 判「错」保持判错 / 缓存命中不重复请求 / 接口 500 静默
// 用法：node test_ai.mjs   （需先起 demo 静态服务 8897 与 mock 服务 8896）
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9386;
const BASE = process.argv[2] || "http://127.0.0.1:8897/chinese-g3up/out/";
const MOCK = "http://127.0.0.1:8896";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "aitest-"));
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

const mockCount = async () => JSON.parse(await get(MOCK + "/count")).n;
const mockReset = async () => { await get(MOCK + "/reset"); };
const mockMode = async (m) => { await get(MOCK + "/mode?m=" + m); };

/* 在知识点区把第 n 个「未作答且可填」的题填错，返回反馈文本 */
const answerWrong = (val) => ev(`(function(){
  var arr=[].slice.call(document.querySelectorAll("#kps .q"));
  for(var i=0;i<arr.length;i++){
    var q=arr[i], inp=q.querySelector("input");
    if(!inp || inp.disabled) continue;
    inp.value=${JSON.stringify(val)};
    q.querySelector(".btn").click();
    var fb=q.querySelector(".fb");
    return JSON.stringify({qid:q.getAttribute("data-qid"), cls:fb.className, txt:fb.textContent.slice(0,40)});
  }
  return "NOQ";
})()`);
/* 按 qid 精确读取某题的反馈（避免读到恢复出来的历史题） */
const fbOf = (qid) => ev(`(function(){
  var q=document.querySelector('.q[data-qid="'+${JSON.stringify(qid)}+'"]');
  if(!q) return "NOQ";
  var fb=q.querySelector(".fb");
  return fb.className + "||" + fb.textContent.slice(0,40);
})()`);
const wbCount = () => ev(`Object.keys(JSON.parse(localStorage.getItem("chinese3.wrongbook.v1.测试甲")||"{}")).length`);

/* ── 场景 1：未配置 AI → 不发请求，判错照旧 ── */
await mockReset(); await mockMode("yes");
await nav(BASE + "u1.html");
await ev(`localStorage.removeItem("studyfree.ai.v1"); localStorage.removeItem("studyfree.aifix.v1"); localStorage.removeItem("chinese3.done.v1.测试甲");`);
await nav(BASE + "u1.html");
const a1 = JSON.parse(await answerWrong("随便一个词") || "{}");
await sleep(800);
const c1 = await mockCount();
const f1 = await fbOf(a1.qid || "");
chk("未配置时不发起 AI 请求", c1 === 0, "请求数 " + c1);
chk("未配置时判错行为不变", String(f1).indexOf(" show no") > -1, f1);
const wb1 = await wbCount();
chk("未配置时错题正常入库（2 条）", wb1 === 2, wb1);

/* ── 场景 2：配置后复核返回「对」→ 自动改判并撤销错题 ── */
await ev(`localStorage.setItem("studyfree.ai.v1", JSON.stringify({on:true,url:"${MOCK}/v1/chat/completions",model:"mock",key:"sk-test"}));`);
await mockReset(); await mockMode("yes");
await ev(`localStorage.removeItem("studyfree.aifix.v1"); localStorage.removeItem("chinese3.wrongbook.v1.测试甲"); localStorage.removeItem("chinese3.done.v1.测试甲");`);
await nav(BASE + "u1.html");
const a2 = JSON.parse(await answerWrong("这是我自己的说法") || "{}");
await sleep(1600);
const c2 = await mockCount();
const f2 = await fbOf(a2.qid || "");
chk("配置后发起一次复核请求", c2 === 1, "请求数 " + c2);
chk("复核为「对」时自动改判并提示 AI 复核",
  String(f2).indexOf(" show ok") > -1 && String(f2).indexOf("AI 复核") > -1, f2);
const wb2 = await wbCount();
chk("改判后错题被撤销（0 条）", wb2 === 0, wb2);

/* ── 场景 3：复核返回「错」→ 保持判错、按钮仍在 ── */
await mockReset(); await mockMode("no");
await ev(`localStorage.removeItem("studyfree.aifix.v1"); localStorage.removeItem("chinese3.done.v1.测试甲");`);
await nav(BASE + "u1.html");
const a3 = JSON.parse(await answerWrong("又一个随便的词") || "{}");
await sleep(1600);
const f3 = await fbOf(a3.qid || "");
const hasFix3 = await ev(`(function(){
  var arr=[].slice.call(document.querySelectorAll("#kps .q"));
  for(var i=0;i<arr.length;i++){
    if(arr[i].querySelector(".fixbtn")) return true;
  }
  return false;
})()`);
chk("复核为「错」时保持判错", String(f3).indexOf(" show no") > -1, f3);
chk("复核为「错」时「算我对」按钮仍在", hasFix3 === true);

/* ── 场景 4：缓存命中 → 不再请求，直接按缓存改判 ── */
await mockReset(); await mockMode("yes");
await ev(`localStorage.removeItem("studyfree.aifix.v1"); localStorage.removeItem("chinese3.wrongbook.v1.测试甲"); localStorage.removeItem("chinese3.done.v1.测试甲");`);
await nav(BASE + "u1.html");
const a4 = JSON.parse(await answerWrong("缓存测试专用答案") || "{}");   /* 第一次：真实请求，写入缓存 */
await sleep(1500);
const c4a = await mockCount();
await ev(`localStorage.removeItem("chinese3.done.v1.测试甲")`);
await nav(BASE + "u1.html");                  /* 刷新：store 清空，缓存保留 */
const a4b = JSON.parse(await answerWrong("缓存测试专用答案") || "{}");  /* 第二次：同题干同答案 */
await sleep(1200);
const c4b = await mockCount();
const f4 = await fbOf(a4b.qid || "");
chk("第一次复核发请求", c4a === 1, "请求数 " + c4a);
chk("相同题干+答案命中缓存不重复请求", c4b === 1, "请求数 " + c4b);
chk("缓存为「对」时直接改判", String(f4).indexOf(" show ok") > -1 && String(f4).indexOf("AI 复核") > -1, f4);

/* ── 场景 5：接口 500 → 静默保持判错，不崩溃 ── */
await mockReset(); await mockMode("err");
await ev(`localStorage.removeItem("studyfree.aifix.v1"); localStorage.removeItem("chinese3.done.v1.测试甲");`);
await nav(BASE + "u1.html");
const a5 = JSON.parse(await answerWrong("接口故障时的答案") || "{}");
await sleep(1800);
const c5 = await mockCount();
const f5 = await fbOf(a5.qid || "");
chk("接口异常时仍发起过请求", c5 === 1, "请求数 " + c5);
chk("接口异常时静默保持判错、页面正常", String(f5).indexOf(" show no") > -1, f5);
const alive = await ev(`!!document.getElementById("kps") && document.querySelectorAll("#kps .q").length > 0`);
chk("异常后页面未崩溃", alive === true);

console.log("\n结果：" + pass + " 过，" + fail + " 败");
ws.close(); proc.kill(); process.exit(fail ? 1 : 0);
