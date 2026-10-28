// 测试：账号制（登录账号+学校班级+姓名）登录 + 门禁 + 账号管理页
// 用法：node test_login.mjs <BASE>   例：http://127.0.0.1:8897/   （服务根须为 demo/）
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("C:/Users/10061/WorkBuddy/studyfree/ChinaStudyFree/node_modules/ws");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const DBG = 9352;
const BASE = process.argv[2] || "http://127.0.0.1:8897/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise((res, rej) => { http.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(d)); }).on("error", rej); });

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "login-"));
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
await send("Emulation.setDeviceMetricsOverride", { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
/* 管理页的 confirm/alert 在无头下自动压掉：删除流程直接放行 */
await send("Page.addScriptToEvaluateOnNewDocument", { source: `window.confirm=()=>true; window.alert=()=>{};` });
/* 注意：本测试不种 session——门禁行为本身就是被测对象 */

async function nav(u) { await send("Page.navigate", { url: u }); await sleep(2000); }
async function ev(e) {
  const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return "ERR:" + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r?.result?.value;
}
let pass = 0, fail = 0;
function chk(name, cond, detail) {
  if (cond) { pass++; console.log("  PASS " + name); }
  else { fail++; console.log("  FAIL " + name + (detail ? "  → " + detail : "")); }
}

/* 1. 登录页：账号密码表单 */
await nav(BASE + "login.html");
chk("登录页可达", (await ev(`location.pathname`)).endsWith("login.html"));
chk("表单含账号与密码输入框", await ev(`!!document.getElementById("acc") && !!document.getElementById("pw") && !!document.getElementById("dologin")`));
await ev(`document.getElementById("dologin").click()`); await sleep(200);
chk("空提交被拦", await ev(`document.getElementById("err").className.indexOf("show")>-1`));
await ev(`document.getElementById("acc").value="nobody1"`);
await ev(`document.getElementById("pw").value="1234"`);
await ev(`document.getElementById("dologin").click()`); await sleep(200);
chk("不存在的账号被拦", ((await ev(`document.getElementById("err").textContent`)) || "").includes("不存在"));

/* 2. 管理页：管理员密码 + 建号（学校/班级/账号/密码） */
await nav(BASE + "accounts.html");
chk("管理页首次显示设置管理员密码", await ev(`document.getElementById("setup").style.display !== "none"`));
await ev(`document.getElementById("s1").value="admin9"`);
await ev(`document.getElementById("s2").value="admin9"`);
await ev(`document.getElementById("mkadm").click()`); await sleep(300);
chk("设置后直接进入管理面板", await ev(`document.getElementById("panel").style.display !== "none"`));

const fillCreate = (nm, sch, cls, acc, p1, p2) => ev(`(function(){
  document.getElementById("nnm").value=${JSON.stringify(nm)};
  document.getElementById("nsch").value=${JSON.stringify(sch)};
  document.getElementById("ncls").value=${JSON.stringify(cls)};
  document.getElementById("nacc").value=${JSON.stringify(acc)};
  document.getElementById("npw").value=${JSON.stringify(p1)};
  document.getElementById("npw2").value=${JSON.stringify(p2)};
  document.getElementById("mkuser").click();
  return document.getElementById("e3").className.indexOf("show")>-1 ? document.getElementById("e3").textContent : "ok";
})()`);
let r = await fillCreate("小明", "实验小学", "三（2）班", "xm2026a", "1234", "1234"); await sleep(200);
chk("建号成功", r === "ok", r);
chk("列表显示姓名/账号/学校班级", ((await ev(`document.getElementById("ulist").textContent`)) || "").includes("实验小学") &&
    ((await ev(`document.getElementById("ulist").textContent`)) || "").includes("三（2）班"));
chk("账号 xm2026a 在列表", ((await ev(`document.getElementById("ulist").textContent`)) || "").includes("xm2026a"));
r = await fillCreate("小明2", "实验小学", "三（2）班", "xm2026a", "1234", "1234");
chk("重复账号被拒", r.includes("已存在"), r);
r = await fillCreate("小刚", "实验小学", "三（2）班", "小刚abc", "1234", "1234");
chk("中文账号被拒", r.includes("英文字母"), r);
r = await fillCreate("小刚", "", "三（2）班", "xg2026c", "1234", "1234");
chk("缺学校被拒", r.includes("学校"), r);
r = await fillCreate("小刚", "实验小学", "三（2）班", "ab", "1234", "1234");
chk("过短账号被拒", r.includes("3–12"), r);
r = await fillCreate("小红", "实验小学", "三（2）班", "xh2026b", "5678", "5678"); await sleep(200);
chk("小红建号成功", r === "ok", r);

/* 3. 管理员重锁 / 错密拒 / 改小明密码 */
await ev(`document.getElementById("relock").click()`); await sleep(200);
chk("重新锁定后面板隐藏", await ev(`document.getElementById("panel").style.display === "none"`));
await ev(`document.getElementById("up").value="wrongpw"`);
await ev(`document.getElementById("dounlock").click()`); await sleep(200);
chk("错误管理密码被拒", await ev(`document.getElementById("e2").className.indexOf("show")>-1`));
await ev(`document.getElementById("up").value="admin9"`);
await ev(`document.getElementById("dounlock").click()`); await sleep(200);
chk("正确管理密码解锁", await ev(`document.getElementById("panel").style.display !== "none"`));

const boxIdx = async (acc) => ev(`(function(){
  var boxes=[].slice.call(document.querySelectorAll("#ulist .uitem"));
  for(var i=0;i<boxes.length;i++){
    var a=boxes[i].querySelector(".acc");
    if(a && a.textContent.indexOf(${JSON.stringify(acc)})>-1) return i;
  }
  return -1;
})()`);
let idx = await boxIdx("xm2026a");
await ev(`(function(){ var b=document.querySelectorAll("#ulist .uitem")[${idx}]; b.querySelector('[data-act="pw"]').click(); })()`); await sleep(200);
await ev(`(function(){ var b=document.querySelectorAll("#ulist .uitem")[${idx}]; b.querySelector("[data-p1]").value="4321"; b.querySelector("[data-p2]").value="4321"; b.querySelector("[data-save]").click(); })()`); await sleep(300);
chk("改密成功", await ev(`(function(){ var u=JSON.parse(localStorage.getItem("studyfree.users.v1")); return u["xm2026a"].pw ? "yes" : "no"; })()`) === "yes");

/* 4. 删号（confirm 已放行） */
idx = await boxIdx("xh2026b");
await ev(`(function(){ var b=document.querySelectorAll("#ulist .uitem")[${idx}]; b.querySelector('[data-act="del"]').click(); })()`); await sleep(400);
const namesAfter = await ev(`Object.keys(JSON.parse(localStorage.getItem("studyfree.users.v1"))).join(",")`);
chk("删号后小红账号消失", !namesAfter.includes("xh2026b"), namesAfter);
chk("小明账号保留", namesAfter.includes("xm2026a"));

/* 5. 门禁 + 登录 */
await nav(BASE + "math-g3up/out/u1.html");
chk("未登录访问学习页被拦到登录页", (await ev(`location.pathname`)).endsWith("login.html"));
await ev(`document.getElementById("acc").value="xm2026a"`);
await ev(`document.getElementById("pw").value="0000"`);
await ev(`document.getElementById("dologin").click()`); await sleep(300);
chk("错密码被拒", ((await ev(`document.getElementById("err").textContent`)) || "").includes("不对"));
await ev(`document.getElementById("pw").value="4321"`);
await ev(`document.getElementById("dologin").click()`); await sleep(2000);
chk("登录后回到被拦截的原页", (await ev(`location.pathname`)).includes("math-g3up/out/u1.html"));
chk("session 用登录账号", ((await ev(`localStorage.getItem("studyfree.session.v1")`)) || "").includes("xm2026a"));
chk("页面内 __USER 为登录账号", await ev(`(typeof __USER==="undefined"?"(none)":__USER)`) === "xm2026a");
chk("用户条显示姓名（__DISP）", (await ev(`document.getElementById("unametxt").textContent`)) === "小明");

/* 6. 旧账号迁移：无密码姓名账号 → 输账号后补设密码 */
await ev(`localStorage.setItem("studyfree.users.v1", JSON.stringify({"老王":{pw:null,created:0,last:0}}))`);
await nav(BASE + "login.html");
await ev(`document.getElementById("acc").value="老王"`);
await ev(`document.getElementById("pw").value="1111"`);
await ev(`document.getElementById("dologin").click()`); await sleep(300);
chk("旧账号进入补设密码流程", await ev(`document.getElementById("setbox").className.indexOf("show")>-1`));
await ev(`document.getElementById("np1").value="ab12"`);
await ev(`document.getElementById("np2").value="ab12"`);
await ev(`document.getElementById("doset").click()`); await sleep(2000);
chk("补设密码后登录到首页", decodeURIComponent(await ev(`location.pathname`)).endsWith("首页.html"));
const lw = await ev(`(function(){ var u=JSON.parse(localStorage.getItem("studyfree.users.v1")); return u["老王"] && u["老王"].pw && u["老王"].pw.h ? "hashed" : "none"; })()`);
chk("旧账号密码已哈希保存", lw === "hashed", lw);

/* 7. 首页用户徽章显示姓名 */
await nav(BASE + "首页.html");
chk("首页徽章显示姓名", ((await ev(`document.getElementById("userchip").textContent`)) || "").includes("老王"));

/* 8. 退出登录 */
await nav(BASE + "login.html");
await ev(`document.getElementById("logout").click()`); await sleep(300);
chk("退出后 session 清除", (await ev(`localStorage.getItem("studyfree.session.v1")`)) === null);

console.log("\n结果：" + pass + " 过，" + fail + " 败");
ws.close(); proc.kill(); process.exit(fail ? 1 : 0);
