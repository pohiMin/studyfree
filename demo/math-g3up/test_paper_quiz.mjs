// 测试：检测卷（单元/期中/期末）限时测验 —— 开始按钮、倒计时、交卷、自动交卷
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9342;
const BASE = process.argv[2] || "http://127.0.0.1:8899/";
const OUT = path.resolve("./out");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "pq-"));
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

async function nav(u) { await send("Page.navigate", { url: u }); await sleep(2400); }
async function ev(e) {
  const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return "ERR:" + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
}
const log = [];
const chk = (n, c, x) => log.push((c ? "PASS " : "FAIL ") + n + (x !== undefined ? " → " + x : ""));

const ANSWER_ALL = `(function(correct){
  var qs=document.querySelectorAll("#pane-paper .q");
  qs.forEach(function(q){
    var ans=(q.getAttribute("data-ans")||"").split("|")[0];
    var opts=q.querySelectorAll(".opt");
    if(opts.length){
      for(var i=0;i<opts.length;i++){
        var v=opts[i].getAttribute("data-val");
        if((correct && v===ans) || (!correct && v!==ans)){ opts[i].click(); break; }
      }
    } else {
      var ip=q.querySelector("input");
      if(ip){ ip.value = correct ? ans : "99999"; ip.dispatchEvent(new Event("input")); }
    }
  });
  return qs.length;
})`;

// ── 1. 单元检测卷：全流程 ──
await nav(BASE + "u1.html");
await ev(`localStorage.clear()`);
await nav(BASE + "u1.html");
await ev(`document.querySelector('#snav .ssub .s2[data-nav="paper"]').click()`);
await sleep(400);

const hasStart = await ev(`!!document.getElementById("paperStart")`);
const qBefore = await ev(`document.querySelectorAll("#pane-paper .q").length`);
const intro = await ev(`document.querySelector(".paper-cover .paper-meta").textContent`);
chk("检测卷有开始按钮", hasStart === true);
chk("开始前不显示题目", qBefore === 0, qBefore + " 题");
chk("开始前说明含限时", /限时\s*40\s*分钟/.test(intro || ""), (intro || "").trim());

await ev(`document.getElementById("paperStart").click()`);
await sleep(700);
const qAfter = await ev(`document.querySelectorAll("#pane-paper .q").length`);
const tmShown = await ev(`document.getElementById("paperTm").style.display !== "none"`);
const tm1 = await ev(`document.getElementById("paperTm").textContent`);
chk("开始后出现全部题目", qAfter === 34, qAfter + " 题");
chk("倒计时启动", tmShown === true, tm1);
chk("倒计时从 40 分钟开始", /^39:5\d$|^40:00$/.test(tm1), tm1);

const n1 = await ev(`${ANSWER_ALL}(true)`);
chk("作答回填", n1 === 34, n1 + " 题");

const metaMid = await ev(`document.getElementById("paperMeta").textContent`);
chk("作答计数更新", /34\s*\/\s*34/.test(metaMid), (metaMid || "").trim());

await ev(`document.getElementById("paperSubmit").click()`);
await sleep(1000);
const sc = await ev(`(document.querySelector("#paperResult .sc")||{}).textContent || ""`);
const starOn = await ev(`document.querySelectorAll("#paperResult .star.on").length`);
const wrongRows = await ev(`document.querySelectorAll("#paperResult .wrow").length`);
const tmAfter = await ev(`document.getElementById("paperTm").textContent`);
const btnTxt = await ev(`(document.getElementById("paperSubmit")||{}).textContent || ""`);
chk("交卷出总分", /100\s*\/\s*100/.test(sc.replace(/\s+/g, " ")) || sc.includes("100"), sc);
chk("满分得 3 星", starOn === 3, starOn + " 星");
chk("满分无错题", wrongRows === 0, wrongRows + " 行");
chk("交卷后倒计时停住", tmAfter === "已交卷", tmAfter);
chk("交卷按钮变已交卷", btnTxt === "已交卷", btnTxt);

// 星记到 u1:paper
const prof = JSON.parse(await ev(`localStorage.getItem("math3.profile.v1.测试甲")`) || "{}");
chk("检测卷星星写入", (prof.stars || {})["u1:paper"] === 3, JSON.stringify(prof.stars));

// ── 2. 期中卷：限时 45 分钟、34 题、满分 100 ──
await nav(BASE + "midterm.html");
const midStart = await ev(`!!document.getElementById("paperStart")`);
const midIntro = await ev(`document.querySelector(".paper-cover .paper-meta").textContent`);
chk("期中卷有开始按钮", midStart === true);
chk("期中限时 45 分钟", /限时\s*45\s*分钟/.test(midIntro || ""), (midIntro || "").trim());

await ev(`document.getElementById("paperStart").click()`);
await sleep(600);
const midQ = await ev(`document.querySelectorAll("#pane-paper .q").length`);
const midTm = await ev(`document.getElementById("paperTm").textContent`);
chk("期中 34 题全部出现", midQ === 34, midQ + " 题");
chk("期中倒计时启动", /^4[45]:\d\d$|^44:5\d$/.test(midTm), midTm);

await ev(`${ANSWER_ALL}(false)`);
await ev(`document.getElementById("paperSubmit").click()`);
await sleep(900);
const midStar = await ev(`document.querySelectorAll("#paperResult .star.on").length`);
const midWrong = await ev(`document.querySelectorAll("#paperResult .wrow").length`);
chk("期中全错得 1 星", midStar === 1, midStar + " 星");
chk("期中列出全错题", midWrong === 34, midWrong + " 行");

// ── 3. 期末卷：限时 70 分钟、41 题、满分 110 ──
await nav(BASE + "final.html");
const finIntro = await ev(`document.querySelector(".paper-cover .paper-meta").textContent`);
chk("期末限时 70 分钟", /限时\s*70\s*分钟/.test(finIntro || ""), (finIntro || "").trim());
await ev(`document.getElementById("paperStart").click()`);
await sleep(600);
const finQ = await ev(`document.querySelectorAll("#pane-paper .q").length`);
const finSc = await ev(`document.querySelector(".paper-cover .paper-meta").textContent`);
chk("期末 41 题", finQ === 41, finQ + " 题");
chk("期末满分 110", /110/.test(finSc || ""), (finSc || "").trim());

// ── 4. 时间到自动交卷（用一份把限时改成 4 秒的副本验证）──
const raw = fs.readFileSync(path.join(OUT, "midterm.html"), "utf8");
const patched = raw.replace("const LIMIT = (P.duration || Math.max(20, Math.round(items.length*1.6))) * 60;",
                             "const LIMIT = 4;");
if (patched === raw) { chk("自动交卷测试准备", false, "未找到 LIMIT 行"); }
else {
  fs.writeFileSync(path.join(OUT, "_auto.html"), patched, "utf8");
  await nav(BASE + "_auto.html");
  await ev(`document.getElementById("paperStart").click()`);
  await sleep(500);
  const t0 = await ev(`document.getElementById("paperTm").textContent`);
  await sleep(4500);
  const hasRes = await ev(`!!document.querySelector("#paperResult .result")`);
  const tmEnd = await ev(`document.getElementById("paperTm").textContent`);
  chk("倒计时正常走秒", t0 === "00:04" || t0 === "00:03", t0);
  chk("时间到自动交卷", hasRes === true);
  chk("自动交卷后显示已交卷", tmEnd === "已交卷", tmEnd);
  try { fs.unlinkSync(path.join(OUT, "_auto.html")); } catch {}
}

// ── 5. 重置：停表、清空、回到未开始 ──
await nav(BASE + "u1.html");
await ev(`document.getElementById("paperStart").click()`);
await sleep(600);
await ev(`window.confirm = function(){ return true; }; document.getElementById("reset").click()`);
await sleep(600);
const rstQ = await ev(`document.querySelectorAll("#pane-paper .q").length`);
const rstBtn = await ev(`(document.getElementById("paperStart")||{}).textContent || ""`);
const rstTm = await ev(`document.getElementById("paperTm").style.display`);
chk("重置后题目清空", rstQ === 0, rstQ + " 题");
chk("重置后按钮复位", rstBtn === "开始检测", rstBtn);
chk("重置后计时隐藏", rstTm === "none", rstTm);

console.log(log.join("\n"));
console.log("\n结果：", log.every(x => x.startsWith("PASS")) ? "全部通过" : "存在失败项");
ws.close(); proc.kill();
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(0);
