// 测试：星星取最高成绩、不累加；用户条显示
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9339;
const BASE = process.argv[2] || "http://127.0.0.1:8899/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "st-"));
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

async function nav(u) { await send("Page.navigate", { url: u }); await sleep(2400); }
async function ev(e) {
  const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return "ERR:" + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
}
const log = [];
const chk = (n, c, x) => log.push((c ? "PASS " : "FAIL ") + n + (x !== undefined ? " → " + x : ""));

async function doQuiz(answerAll) {
  await ev(`document.querySelector('#snav .ssub .s2[data-nav="exam"]').click()`);
  await sleep(300);
  await ev(`document.getElementById("examStart").click()`);
  await sleep(700);
  await ev(`(function(){
    var all=${answerAll};
    document.querySelectorAll("#pane-exam .q").forEach(function(q){
      var ans=q.getAttribute("data-ans");
      var opts=q.querySelectorAll(".opt");
      if(opts.length){
        for(var i=0;i<opts.length;i++){
          var v=opts[i].getAttribute("data-val");
          if(all ? v===ans : v!==ans){ opts[i].click(); return; }
        }
      } else {
        var ip=q.querySelector("input");
        if(ip){ ip.value = all ? ans : "99999"; ip.dispatchEvent(new Event("input")); }
      }
    });
    return 1;
  })()`);
  await sleep(400);
  await ev(`document.getElementById("examSubmit").click()`);
  await sleep(1200);
}

// 1. 初始状态
await nav(BASE + "u1.html");
await ev(`localStorage.clear()`);
await nav(BASE + "u1.html");
const initTotal = await ev(`document.getElementById("startotal").textContent`);
const initName = await ev(`document.getElementById("unametxt").textContent`);
const hasAvatar = await ev(`!!document.getElementById("avatar")`);
chk("用户条有头像", hasAvatar === true);
chk("默认名称", initName === "小朋友", initName);
chk("初始星星为 0", initTotal === "0", initTotal);

// 2. 全对 → 3 星
await doQuiz(true);
let st = JSON.parse(await ev(`localStorage.getItem("math3.profile.v1")`) || "{}");
chk("全对记 3 星", (st.stars||{})["u1:exam"] === 3, JSON.stringify(st.stars));
let tot = await ev(`document.getElementById("startotal").textContent`);
chk("总数显示 3", tot === "3", tot);

// 3. 重载后再全错 → 仍是 3 星（不累加、不覆盖为低分）
await nav(BASE + "u1.html");
await doQuiz(false);
st = JSON.parse(await ev(`localStorage.getItem("math3.profile.v1")`) || "{}");
chk("再考差仍保留 3 星", (st.stars||{})["u1:exam"] === 3, JSON.stringify(st.stars));
tot = await ev(`document.getElementById("startotal").textContent`);
chk("总数仍是 3 未翻倍", tot === "3", tot);

// 4. 检测卷全对 → 再加 3，总数 6
await nav(BASE + "u1.html");
await ev(`document.querySelector('#snav .ssub .s2[data-nav="paper"]').click()`);
await sleep(400);
const pQ0 = await ev(`document.querySelectorAll("#pane-paper .q").length`);
chk("检测卷开始前无题", pQ0 === 0, pQ0 + " 题");
await ev(`document.getElementById("paperStart").click()`);
await sleep(600);
await ev(`(function(){
  var qs=document.querySelectorAll("#pane-paper .q");
  qs.forEach(function(q){
    var ans=q.getAttribute("data-ans");
    var opts=q.querySelectorAll(".opt");
    if(opts.length){ for(var i=0;i<opts.length;i++){ if(opts[i].getAttribute("data-val")===ans){ opts[i].click(); return; } } }
    else { var ip=q.querySelector("input"); if(ip){ ip.value=ans; ip.dispatchEvent(new Event("input")); } }
  });
  return qs.length;
})()`);
await sleep(400);
await ev(`document.getElementById("paperSubmit").click()`);
await sleep(1200);
st = JSON.parse(await ev(`localStorage.getItem("math3.profile.v1")`) || "{}");
chk("检测卷记 3 星", (st.stars||{})["u1:paper"] === 3, JSON.stringify(st.stars));
tot = await ev(`document.getElementById("startotal").textContent`);
chk("总数累加到 6", tot === "6", tot);
const subTxt = await ev(`document.getElementById("usub").textContent`);
chk("副标题说明取最高", /最好一次/.test(subTxt || ""), subTxt);

// 5. 改名字
await ev(`(function(){ var p=JSON.parse(localStorage.getItem("math3.profile.v1")||"{}"); p.name="小明"; localStorage.setItem("math3.profile.v1",JSON.stringify(p)); return 1; })()`);
await nav(BASE + "u1.html");
const nm2 = await ev(`document.getElementById("unametxt").textContent`);
const av2 = await ev(`document.getElementById("avatar").textContent`);
chk("名字持久化", nm2 === "小明", nm2);
chk("头像取首字", av2 === "小", av2);

console.log(log.join("\n"));
console.log("\n结果：", log.every(x => x.startsWith("PASS")) ? "全部通过" : "存在失败项");
ws.close(); proc.kill();
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(0);
