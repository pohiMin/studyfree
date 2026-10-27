// 测试：侧栏目录树（用户条置顶、单元子项在目录内、右侧无分区标签）
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9346;
const BASE = process.argv[2] || "http://127.0.0.1:8899/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "nav-"));
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

// ── 1. 用户条位置 ──
const inSide = await ev(`!!document.querySelector("#side #userbar")`);
const inFrame = await ev(`!!document.querySelector(".frame #userbar")`);
const ubTop = await ev(`document.getElementById("userbar").getBoundingClientRect().top`);
const brandTop = await ev(`document.querySelector(".brand").getBoundingClientRect().top`);
chk("用户条在侧栏内", inSide === true);
chk("主区不再有用户条", inFrame === false);
chk("用户条在科目目录上方", ubTop < brandTop, `${Math.round(ubTop)} < ${Math.round(brandTop)}`);
const sbW = await ev(`document.querySelector("#side #userbar").getBoundingClientRect().width`);
const sideW = await ev(`document.getElementById("side").getBoundingClientRect().width`);
chk("用户条不溢出侧栏", sbW <= sideW, `${Math.round(sbW)} / ${Math.round(sideW)}`);

// ── 2. 目录树结构 ──
const units = await ev(`[].filter.call(document.querySelectorAll("#snav > .sitem"), function(a){ return !!a.querySelector(".n"); }).length`);
const subs = await ev(`document.querySelectorAll("#snav .ssub .s2").length`);
const kpSubs = await ev(`document.querySelectorAll('#snav .ssub .s2[data-nav^="kp"]').length`);
const hasExamSub = await ev(`!!document.querySelector('#snav .ssub .s2[data-nav="exam"]')`);
const hasPaperSub = await ev(`!!document.querySelector('#snav .ssub .s2[data-nav="paper"]')`);
chk("侧栏九个单元", units === 9, units + " 个");
chk("当前单元展开子项目", subs === 9, subs + " 项（7 知识点 + 自测 + 检测卷）");
chk("子项含 7 个知识点", kpSubs === 7, kpSubs);
chk("子项含随堂自测", hasExamSub === true);
chk("子项含单元检测卷", hasPaperSub === true);
const subIndent = await ev(`(function(){
  var u=document.querySelectorAll("#snav > .sitem")[0].getBoundingClientRect().left;
  var s=document.querySelector("#snav .ssub .s2").getBoundingClientRect().left;
  return Math.round(s-u);
})()`);
chk("子项相对单元缩进", subIndent > 8, subIndent + "px");

// ── 3. 右侧面板不再有分区标签 ──
chk("右侧无分区标签栏", (await ev(`!!document.getElementById("mtabs")`)) === false);
chk("右侧无知识点胶囊", (await ev(`!!document.getElementById("kptabs")`)) === false);

// ── 4. 点侧栏子项切换 ──
await ev(`document.querySelectorAll('#snav .ssub .s2[data-nav^="kp"]')[2].click()`);
await sleep(500);
const shownKp = await ev(`[].map.call(document.querySelectorAll("#kps .kp"), function(x,i){ return x.classList.contains("show")?i:-1; }).filter(function(i){return i>=0;})`);
const onNav = await ev(`(document.querySelector("#snav .ssub .s2.on")||{}).dataset ? document.querySelector("#snav .ssub .s2.on").dataset.nav : ""`);
const paneKpShow = await ev(`document.getElementById("pane-kp").classList.contains("show")`);
chk("点第 3 个知识点只显示它", JSON.stringify(shownKp) === "[2]", JSON.stringify(shownKp));
chk("侧栏高亮跟着走", onNav === "kp2", onNav);
chk("知识点面板可见", paneKpShow === true);

await ev(`document.querySelector('#snav .ssub .s2[data-nav="exam"]').click()`);
await sleep(500);
const examShow = await ev(`document.getElementById("pane-exam").classList.contains("show")`);
const kpHide = await ev(`document.getElementById("pane-kp").classList.contains("show")`);
const onExam = await ev(`document.querySelector("#snav .ssub .s2.on").dataset.nav`);
chk("点随堂自测切到自测面板", examShow === true && kpHide === false);
chk("随堂自测高亮", onExam === "exam", onExam);

await ev(`document.querySelectorAll('#snav .ssub .s2[data-nav^="kp"]')[4].click()`);
await sleep(500);
const backKp = await ev(`document.getElementById("pane-kp").classList.contains("show")`);
const shownKp2 = await ev(`[].map.call(document.querySelectorAll("#kps .kp"), function(x,i){ return x.classList.contains("show")?i:-1; }).filter(function(i){return i>=0;})`);
const onKp4 = await ev(`document.querySelector("#snav .ssub .s2.on").dataset.nav`);
chk("从自测点知识点能切回", backKp === true, JSON.stringify(shownKp2));
chk("切回后高亮正确", onKp4 === "kp4", onKp4);

await ev(`document.querySelector('#snav .ssub .s2[data-nav="paper"]').click()`);
await sleep(500);
const paperShow = await ev(`document.getElementById("pane-paper").classList.contains("show")`);
chk("点单元检测卷切到卷面", paperShow === true);

// ── 5. 星星总数在侧栏用户条里 ──
await ev(`(function(){
  var p=JSON.parse(localStorage.getItem("math3.profile.v1")||"{}");
  p.stars=Object.assign({}, p.stars, {"u1:exam":3,"u1:paper":2});
  localStorage.setItem("math3.profile.v1",JSON.stringify(p));
  return 1;
})()`);
await nav(BASE + "u1.html");
const starTxt = await ev(`document.getElementById("startotal").textContent`);
const starInSide = await ev(`!!document.querySelector("#side #userbar #startotal")`);
chk("星星总数显示在侧栏", starInSide === true && starTxt === "5", starTxt);

// ── 6. 期中页：无单元子项，期中检测高亮 ──
await nav(BASE + "midterm.html");
const midSubs = await ev(`document.querySelectorAll("#snav .ssub .s2").length`);
const midOn = await ev(`(document.querySelector("#snav > .sitem.on")||{}).textContent || ""`);
chk("期中页无单元子项", midSubs === 0, midSubs + " 项");
chk("期中检测高亮", /期中检测/.test(midOn), midOn.trim());
const midPaper = await ev(`document.getElementById("pane-paper").classList.contains("show")`);
chk("期中页直接显示卷面", midPaper === true);

console.log(log.join("\n"));
console.log("\n结果：", log.every(x => x.startsWith("PASS")) ? "全部通过" : "存在失败项");
ws.close(); proc.kill();
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(0);
