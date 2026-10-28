// 数值断言：用户条显示 姓名 + 学校·班级（unit 侧栏 + index 主区）
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9371;
const BASE = process.argv[2] || "http://127.0.0.1:8897/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "ubar-"));
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
async function nav(u) { await send("Page.navigate", { url: u }); await sleep(2300); }
async function ev(e) {
  const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return "ERR:" + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
}
let pass = 0, fail = 0;
const chk = (n, c, d) => { if (c) { pass++; console.log("  PASS " + n); } else { fail++; console.log("  FAIL " + n + (d !== undefined ? " → " + d : "")); } };

const SEED = `try{
localStorage.setItem("studyfree.session.v1", JSON.stringify({name:"xm2026a",ts:Date.now()}));
localStorage.setItem("studyfree.users.v1", JSON.stringify({"xm2026a":{disp:"小明",school:"实验小学",cls:"三（2）班",pw:{s:"a",h:"b"},created:Date.now(),last:0}}));
}catch(e){}`;
await send("Page.addScriptToEvaluateOnNewDocument", { source: SEED });

await nav(BASE + "math-g3up/out/u1.html");
chk("unit: 未被门禁拦截", (await ev(`location.pathname`)).includes("u1.html"));
chk("unit: 用户条显示姓名", (await ev(`document.getElementById("unametxt").textContent`)) === "小明");
const sch = await ev(`(function(){
  var el=document.getElementById("uschool");
  return el ? {t:el.textContent, vis:el.style.display!=="none",
    clip: el.scrollWidth > el.clientWidth} : null;
})()`);
chk("unit: 学校班级文字正确", sch && sch.t === "实验小学·三（2）班", JSON.stringify(sch));
chk("unit: 学校行可见", sch && sch.vis === true);
chk("unit: 学校行无截断", sch && sch.clip === false);

await nav(BASE + "math-g3up/out/index.html");
chk("index: 用户条显示姓名", (await ev(`document.getElementById("uname").textContent`)) === "小明");
const sch2 = await ev(`(function(){
  var el=document.getElementById("uschool");
  return el ? {t:el.textContent, clip: el.scrollWidth > el.clientWidth} : null;
})()`);
chk("index: 学校班级文字正确", sch2 && sch2.t === "实验小学·三（2）班", JSON.stringify(sch2));
chk("index: 学校行无截断", sch2 && sch2.clip === false);

console.log("\n结果：" + pass + " 过，" + fail + " 败");
ws.close(); proc.kill(); process.exit(fail ? 1 : 0);
