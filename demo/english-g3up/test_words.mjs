// 测试：背单词 —— 卡片翻面 / 考一考 / 连对 3 次掌握 / 答错清零 / 持久化
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9355;
const BASE = process.argv[2] || "http://127.0.0.1:8899/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "wd-"));
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

/* 词汇数据（构建产物） */
const wj = JSON.parse(fs.readFileSync(path.resolve("./out/data/words.json"), "utf8"));
const zh2en = {}, en2zh = {};
wj.forEach(g => g.words.forEach(w => { zh2en[w.zh] = w.w; en2zh[w.w] = w.zh; }));

await nav(BASE + "words.html");
await ev(`localStorage.clear()`);
await nav(BASE + "words.html");

// 1. 结构
const navCount = await ev(`document.querySelectorAll("#snav .sitem").length`);
chk("侧栏 9 组", navCount === 9, navCount + " 组");
const statTotal = await ev(`(document.querySelector("#stat .box b")||{}).textContent`);
chk("默认第一组词数", statTotal === "7", statTotal);
const srcNote = await ev(`(document.querySelector("#lead .src")||{}).textContent || ""`);
chk("注明词汇来源", /不是课本官方词汇表/.test(srcNote), (srcNote || "").slice(0, 40) + "…");

// 2. 看卡片：翻面
const cards = await ev(`document.querySelectorAll("#cardsBox .wcard").length`);
chk("第一组 7 张卡片", cards === 7, cards + " 张");
await ev(`document.querySelectorAll("#cardsBox .wcard")[0].click()`);
await sleep(200);
const opened = await ev(`document.querySelectorAll("#cardsBox .wcard.open").length`);
const zhShown = await ev(`(document.querySelector("#cardsBox .wcard.open .flip .zh")||{}).textContent`);
chk("点卡片翻面显示中文", opened === 1 && (zhShown || "").length > 0, zhShown);

// 3. 考一考：连对 3 次 → 掌握
await ev(`document.getElementById("tabQuiz").click()`);
await sleep(300);

async function answerCorrectly() {
  // 读题面（英文或中文），从词表查正确答案，点击对应选项
  for (let attempt = 0; attempt < 6; attempt++) {
    const big = await ev(`(document.querySelector(".qword .big")||{}).textContent`);
    if (!big) return "NOQ";
    const isEn = /[a-zA-Z]/.test(big) && !/[\u4e00-\u9fff]/.test(big);
    const ans = isEn ? en2zh[big] : zh2en[big];
    if (!ans) return "LOOKUP-FAIL:" + big;
    const clicked = await ev(`(function(){
      var want=${JSON.stringify(ans)};
      var bs=[].slice.call(document.querySelectorAll(".qopt"));
      for(var i=0;i<bs.length;i++){ if(bs[i].textContent===want){ bs[i].click(); return "clicked"; } }
      return "OPT-NOT-FOUND:"+bs.map(function(b){return b.textContent}).join("|");
    })()`);
    if (clicked === "clicked") {
      await sleep(250);
      return await ev(`document.querySelector(".qfb").className.indexOf("ok")>-1 ? "RIGHT" : "WRONG"`);
    }
    return clicked;
  }
  return "EXHAUSTED";
}

let fb1 = await answerCorrectly();
let s1 = JSON.parse(await ev(`localStorage.getItem("english3.words.v1")`) || "{}");
let vals1 = Object.values(s1);
chk("第 1 次答对 streak=1", fb1 === "RIGHT" && vals1.some(v => v.streak === 1),
    fb1 + " / " + JSON.stringify(vals1.map(v => v.streak)));

await ev(`document.querySelector(".next").click()`);
await sleep(300);
let fb2 = await answerCorrectly();
let st2 = Object.values(JSON.parse(await ev(`localStorage.getItem("english3.words.v1")`) || "{}"));
chk("第 2 次答对（一词一关，同一词）streak=2", fb2 === "RIGHT" && st2.some(v => v.streak === 2),
    fb2 + " / " + JSON.stringify(st2.map(v => v.streak)));

await ev(`document.querySelector(".next").click()`);
await sleep(300);
let fb3 = await answerCorrectly();
let st3 = Object.values(JSON.parse(await ev(`localStorage.getItem("english3.words.v1")`) || "{}"));
const masteredNow = st3.filter(v => v.streak >= 3).length;
chk("第 3 次答对标记掌握", fb3 === "RIGHT" && masteredNow >= 1,
    fb3 + " / 掌握 " + masteredNow + " 个");

// 4. 答错清零：故意点一个非正确答案的选项
await ev(`document.querySelector(".next").click()`);
await sleep(300);
const bigTxt = await ev(`document.querySelector(".qword .big").textContent`);
const isEn = /[a-zA-Z]/.test(bigTxt) && !/[\u4e00-\u9fff]/.test(bigTxt);
const correctAns = isEn ? en2zh[bigTxt] : zh2en[bigTxt];
const wrongRes = await ev(`(function(){
  var bs=document.querySelectorAll(".qopt");
  var want=${JSON.stringify(correctAns)};
  for(var i=0;i<bs.length;i++){ if(bs[i].textContent!==want){ bs[i].click(); return "WRONG"; } }
  return "ALL-SAME";
})()`);
let zeroStreak = await ev(`(function(){
  var o=JSON.parse(localStorage.getItem("english3.words.v1")||"{}");
  return Object.values(o).some(function(v){ return v.streak===0 && (v.wrong||0)>0; });
})()`);
chk("答错后 streak 清零", wrongRes === "WRONG" && zeroStreak === true,
    wrongRes + " / zero=" + zeroStreak);

// 5. 持久化：刷新后掌握状态还在
await nav(BASE + "words.html");
const persisted = await ev(`(function(){
  var o=JSON.parse(localStorage.getItem("english3.words.v1")||"{}");
  return Object.values(o).filter(function(v){ return v.streak>=3; }).length;
})()`);
chk("刷新后掌握状态保持", persisted >= 1, persisted + " 个已掌握");
const mkOnCard = await ev(`document.querySelectorAll("#cardsBox .wcard.mastered").length`);
chk("卡片显示掌握标记", mkOnCard >= 1, mkOnCard + " 张带对勾");

// 6. 侧栏进度刷新
const pg = await ev(`document.querySelector("#snav .sitem .pg").textContent`);
chk("侧栏显示进度 1/7", pg === "1/7", pg);

console.log(log.join("\n"));
console.log("\n结果：", log.every(x => x.startsWith("PASS")) ? "全部通过" : "存在失败项");
ws.close(); proc.kill();
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(0);
