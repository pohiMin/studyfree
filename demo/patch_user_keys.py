# -*- coding: utf-8 -*-
"""三科模板接入登录用户：存储 key 加用户后缀 + 侧栏切换入口 + 平板适配 CSS"""
import io

USER_JS = '''<script>const __USER = (function(){ try{ var s=JSON.parse(localStorage.getItem("studyfree.session.v1")||"null"); return (s&&s.name)? String(s.name).replace(/[^0-9A-Za-z\\u4e00-\\u9fff]/g,"").slice(0,12) : ""; }catch(e){ return ""; } })();</script>'''

def add_user_js(h):
    """在 BOOK script 之前注入 __USER"""
    if "__USER" in h:
        return h
    anchor = '<script>const BOOK ='
    if anchor not in h:
        raise SystemExit("BOOK anchor 未找到")
    return h.replace(anchor, USER_JS + '\n' + anchor, 1)

for subj in ["chinese-g3up", "english-g3up", "math-g3up"]:
    prefix = {"chinese-g3up":"chinese3","english-g3up":"english3","math-g3up":"math3"}[subj]

    # ── template_unit.html ──
    p = subj + "/template_unit.html"
    h = io.open(p, encoding="utf-8").read()
    h = add_user_js(h)
    h = h.replace('const WB_KEY = "%s.wrongbook.v1";' % prefix,
                  'const WB_KEY = "%s.wrongbook.v1" + (__USER ? "." + __USER : "");' % prefix, 1)
    h = h.replace('const PF_KEY = "%s.profile.v1";' % prefix,
                  'const PF_KEY = "%s.profile.v1" + (__USER ? "." + __USER : "");' % prefix, 1)
    # 侧栏底部加切换用户入口（易错题本之后）
    old = '''    nav.appendChild(rv);
    wbBadge();'''
    new = '''    nav.appendChild(rv);
    const lg = el("a","sback","切换使用者 →");
    lg.href = "../login.html";
    nav.appendChild(lg);
    wbBadge();'''
    if "切换使用者" not in h:
        if old not in h: raise SystemExit(p + " 侧栏锚点未找到")
        h = h.replace(old, new, 1)
    # 平板适配 CSS：加在 html{font-size 行所在规则后
    anchor = "  html{font-size:17px}"
    if anchor in h and "pointer:coarse" not in h:
        h = h.replace(anchor, anchor + """
  /* ── 平板适配：字号与触控 ── */
  @media(min-width:761px) and (max-width:1120px){ html{font-size:18.5px} }
  @media(max-width:900px){ html{font-size:18px} }
  @media(pointer:coarse){
    .opt{padding:14px 16px}
    .inp-row input{padding:13px 15px}
    .btn{padding:12px 24px}
    .startbtn{padding:14px 34px}
    .mtab,.kptab{padding-top:12px;padding-bottom:12px}
    .sitem{padding:11px 12px}
  }""", 1)
    io.open(p, "w", encoding="utf-8").write(h)
    print(p, "OK")

    # ── template_review.html ──
    p = subj + "/template_review.html"
    h = io.open(p, encoding="utf-8").read()
    h = add_user_js(h)
    h = h.replace('const WB_KEY = "%s.wrongbook.v1";' % prefix,
                  'const WB_KEY = "%s.wrongbook.v1" + (__USER ? "." + __USER : "");' % prefix, 1)
    anchor = "  html{font-size:17px}"
    if anchor in h and "pointer:coarse" not in h:
        h = h.replace(anchor, anchor + """
  @media(min-width:761px) and (max-width:1120px){ html{font-size:18.5px} }
  @media(max-width:900px){ html{font-size:18px} }
  @media(pointer:coarse){ .opt{padding:14px 16px} .btn{padding:12px 24px} .sitem{padding:11px 12px} }""", 1)
    io.open(p, "w", encoding="utf-8").write(h)
    print(p, "OK")

    # ── template_index.html ──
    p = subj + "/template_index.html"
    h = io.open(p, encoding="utf-8").read()
    h = add_user_js(h)
    h = h.replace('const KEY = "%s.profile.v1";' % prefix,
                  'const KEY = "%s.profile.v1" + (__USER ? "." + __USER : "");' % prefix, 1)
    io.open(p, "w", encoding="utf-8").write(h)
    print(p, "OK")

# ── template_words.html（仅英语）──
p = "english-g3up/template_words.html"
h = io.open(p, encoding="utf-8").read()
h = add_user_js(h)
h = h.replace('const KEY = "english3.words.v1";',
              'const KEY = "english3.words.v1" + (__USER ? "." + __USER : "");', 1)
anchor = "  html{font-size:17px}"
if anchor in h and "pointer:coarse" not in h:
    h = h.replace(anchor, anchor + """
  @media(min-width:761px) and (max-width:1120px){ html{font-size:18.5px} }
  @media(max-width:900px){ html{font-size:18px} }
  @media(pointer:coarse){ .qopt{padding:15px 16px} .wcard{min-height:150px} .sitem{padding:11px 12px} }""", 1)
io.open(p, "w", encoding="utf-8").write(h)
print(p, "OK")
