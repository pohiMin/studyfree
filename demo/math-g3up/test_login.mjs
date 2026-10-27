// 测试：登录流程 —— 创建用户 / session / 数据按用户隔离 / 切换 / 退出
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9362;
const BASE = process.argv[2] || "http://127.0.0.1:8897/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "lg-"));
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
await send("Emulation.setDeviceMetricsOverride", { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });

async function nav(u) { await send("Page.navigate", { url: u }); await sleep(2000); }
async function ev(e) {
  const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return "ERR:" + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
}
const log = [];
const chk = (n, c, x) => log.push((c ? "PASS " : "FAIL ") + n + (x !== undefined ? " → " + x : ""));

await nav(BASE + "login.html");
await ev(`localStorage.clear()`);
await nav(BASE + "login.html");

// 1. 创建用户 测试甲
await ev(`document.getElementById("nm").value="测试甲"; document.getElementById("create").click();`);
await sleep(800);
const curUrl = await ev(`location.pathname.split("/").pop()`);
const sess1 = await ev(`JSON.parse(localStorage.getItem("studyfree.session.v1")||"null")`);
chk("创建后自动登录并跳回首页", curUrl.includes("首页") || curUrl.includes("%E9%A6%96"), curUrl);
chk("session 记录了测试甲", sess1 && sess1.name === "测试甲", JSON.stringify(sess1));

// 2. 首页 chip 显示当前用户
const chip = await ev(`(document.getElementById("userchip")||{}).textContent || ""`);
chk("首页显示当前使用者", /测试甲/.test(chip), (chip || "").slice(0, 24));

// 3. 数学 u1 答错一题 → 数据落在 测试甲 的 key 下
await nav(BASE + "math-g3up/out/u1.html");
const wrong = await ev(`(function(){
  var n=0;
  var qs=document.querySelectorAll("#kps .q");
  for(var i=0;i<qs.length && n<1;i++){
    var q=qs[i], opts=q.querySelectorAll(".opt");
    if(!opts.length) continue;
    var ans=q.getAttribute("data-ans");
    for(var j=0;j<opts.length;j++){ if(opts[j].getAttribute("data-val")!==ans){ opts[j].click(); n++; break; } }
  }
  return n;
})()`);
await sleep(400);
const keysA = await ev(`Object.keys(localStorage).filter(function(k){ return k.indexOf("wrongbook")>-1; })`);
chk("错题 key 带用户后缀", Array.isArray(keysA) && keysA.some(k => k.indexOf(".测试甲") > -1), JSON.stringify(keysA));
const wbA = JSON.parse(await ev(`localStorage.getItem("math3.wrongbook.v1.测试甲")`) || "{}");
chk("测试甲错题已入库", Object.keys(wbA).length >= 1, Object.keys(wbA).length + " 条");
chk("游客 key 保持为空", !(await ev(`localStorage.getItem("math3.wrongbook.v1")`)),
    "游客 wrongbook 不存在 ✓");

// 4. 切换到 测试乙 → 错题本应为空
await nav(BASE + "login.html");
await ev(`document.getElementById("nm").value="测试乙"; document.getElementById("create").click();`);
await sleep(800);
await nav(BASE + "math-g3up/out/u1.html");
const wbB = await ev(`(function(){
  for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i);
    if(k.indexOf("wrongbook")>-1 && k.indexOf("测试乙")>-1) return localStorage.getItem(k); }
  return null;
})()`);
chk("测试乙错题本为空（数据隔离）", wbB === null, String(wbB));

// 5. 切回测试甲 → 错题还在
await nav(BASE + "login.html");
await ev(`(function(){
  var bs=[].slice.call(document.querySelectorAll(".uitem"));
  for(var i=0;i<bs.length;i++){ if(bs[i].textContent.indexOf("测试甲")>-1){ bs[i].click(); return 1; } }
  return 0;
})()`);
await sleep(800);
await nav(BASE + "math-g3up/out/u1.html");
const wbA2 = await ev(`localStorage.getItem("math3.wrongbook.v1.测试甲")`);
chk("切回测试甲错题仍在", wbA2 && Object.keys(JSON.parse(wbA2)).length >= 1,
    wbA2 ? Object.keys(JSON.parse(wbA2)).length + " 条" : "无");

// 6. 退出登录 → 游客
await nav(BASE + "login.html");
await ev(`document.getElementById("logout").click()`);
await sleep(500);
const sess2 = await ev(`localStorage.getItem("studyfree.session.v1")`);
chk("退出后 session 清空", sess2 === null, String(sess2));

// 7. 平板字号断点（1024 视口下 html font-size 应为 18.5px）
await nav(BASE + "math-g3up/out/u1.html");
const fs1 = await ev(`getComputedStyle(document.documentElement).fontSize`);
chk("平板横屏字号 18.5px", fs1 === "18.5px", fs1);

console.log(log.join("\n"));
console.log("\n结果：", log.every(x => x.startsWith("PASS")) ? "全部通过" : "存在失败项");
ws.close(); proc.kill();
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
process.exit(0);
