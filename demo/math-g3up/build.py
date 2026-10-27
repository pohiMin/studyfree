# -*- coding: utf-8 -*-
"""
苏教版三年级上册 · 数学整册构建器
读 content/u*.py → 校验 → 输出 out/uN.html + out/data/uN.json + out/index.html
"""
import os, sys, json, glob, importlib.util

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "out")
os.makedirs(os.path.join(OUT, "data"), exist_ok=True)

BOOK = {
    "title": "苏教版 · 数学 · 三年级上册",
    "edition": "2025 年 7 月第 1 版（2026 年 7 月第 2 次印刷）",
    "isbn": "978-7-5743-1775-8",
    "intro": (
        "<b>怎么用：</b>按单元顺序往下走，每个单元先看知识点，再做题。"
        "答错的题会立刻给出解析，错在哪要看清，不要只记答案。<br>"
        "<b>顺序建议：</b>第二、六单元（乘、除笔算）是本册最重的地基，"
        "第一、七单元（运算顺序与两步问题）紧跟其后，第四单元（量感）需要动手量，"
        "第五、八单元（图形）需要动手摆，第三单元（统计）放最后也不影响。<br>"
        "<b>说明：</b>本页所有练习均为自主练习，不计排名、不设考试。"
    ),
}

# 全册八个单元（用于目录页占位）
ALL_UNITS = [
    (1, "混合运算与数量关系（一）"),
    (2, "两、三位数乘一位数"),
    (3, "数据的收集与整理"),
    (4, "毫米、分米和千米"),
    (5, "平移、旋转和轴对称"),
    (6, "两、三位数除以一位数"),
    (7, "数量关系的分析（一）"),
    (8, "观察物体（二）"),
    (9, "期末复习"),
]


def load_units():
    units = {}
    for path in sorted(glob.glob(os.path.join(BASE, "content", "u*.py"))):
        name = os.path.splitext(os.path.basename(path))[0]
        spec = importlib.util.spec_from_file_location(name, path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        u = mod.UNIT
        units[int(u["unitNumber"])] = u
    return units


def load_module(name):
    path = os.path.join(BASE, "content", name + ".py")
    if not os.path.exists(path):
        return None
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return getattr(mod, "UNIT", None)


def _check_q(q, tag, errs):
    """单题校验：题型、答案、解析、难度层级"""
    if q.get("level") not in (None, "basic", "advance", "challenge"):
        errs.append(f"{tag} level 只能是 basic/advance/challenge")
    if q["type"] == "choice":
        if q["answer"] not in "ABCDEF"[: len(q["options"])]:
            errs.append(f"{tag} 答案越界")
        if len(q["options"]) < 2:
            errs.append(f"{tag} 选项不足")
    elif q["type"] == "true_false":
        if q["answer"] not in ("对", "错"):
            errs.append(f"{tag} 判断题答案须为 对/错")
    elif q["type"] == "input":
        if not str(q.get("answer", "")).strip():
            errs.append(f"{tag} 填空缺答案")
    else:
        errs.append(f"{tag} 未知题型 {q['type']}")
    if not q.get("explanation"):
        errs.append(f"{tag} 缺解析")


def validate(units):
    errs = []
    for n, u in units.items():
        if not u.get("unitTitle"):
            errs.append(f"U{n} 缺 unitTitle")
        ids = set()
        for kp in u["knowledgePoints"]:
            if kp["id"] in ids:
                errs.append(f"U{n} 知识点 id 重复：{kp['id']}")
            ids.add(kp["id"])
            for i, q in enumerate(kp["questions"]):
                _check_q(q, f"U{n}/{kp['title']}/Q{i+1}", errs)
        for i, q in enumerate((u.get("exam") or {}).get("questions", [])):
            _check_q(q, f"U{n}/自测/Q{i+1}", errs)

        # 视频区（可选）
        for i, v in enumerate(u.get("videos", [])):
            tag = f"U{n}/视频{i+1}"
            for f in ("title", "source", "url"):
                if not v.get(f):
                    errs.append(f"{tag} 缺 {f}")
            if v.get("url") and not str(v["url"]).startswith(("http://", "https://")):
                errs.append(f"{tag} url 必须是 http(s) 链接")

        # 单元检测卷（可选）
        paper = u.get("paper")
        if paper:
            total = 0
            for si, sec in enumerate(paper.get("sections", [])):
                if not sec.get("name"):
                    errs.append(f"U{n}/检测卷 第{si+1}大题缺 name")
                per = sec.get("perScore", 0)
                qn = len(sec.get("questions", []))
                if qn == 0:
                    errs.append(f"U{n}/检测卷 第{si+1}大题没有题目")
                total += per * qn
                for qi, q in enumerate(sec.get("questions", [])):
                    _check_q(q, f"U{n}/检测卷/第{si+1}大题Q{qi+1}", errs)
            if total != paper.get("totalScore"):
                errs.append(
                    f"U{n}/检测卷 分值不匹配：各题合计 {total}，声明满分 {paper.get('totalScore')}"
                )
    return errs



def build():
    units = load_units()
    errs = validate(units)
    if errs:
        print("校验失败：")
        for e in errs:
            print("  -", e)
        sys.exit(1)

    total_q = 0
    rows = []
    for n in sorted(units):
        u = units[n]
        kp_q = sum(len(k["questions"]) for k in u["knowledgePoints"])
        adv_q = sum(1 for k in u["knowledgePoints"] for q in k["questions"] if q.get("level") == "advance")
        ex_q = len(u.get("exam", {}).get("questions", []))
        pp_q = sum(len(s.get("questions", [])) for s in u.get("paper", {}).get("sections", []))
        total_q += kp_q + ex_q + pp_q
        rows.append((n, u["unitTitle"], len(u["knowledgePoints"]), kp_q + ex_q + pp_q, adv_q, pp_q))

    book_units = [{"n": r[0], "t": r[1]} for r in rows]
    mid = load_module("midterm")
    fin = load_module("final")
    book_ctx = dict(BOOK, units=book_units, totalQ=total_q, hasMidterm=bool(mid), hasFinal=bool(fin))

    tpl = open(os.path.join(BASE, "template_unit.html"), encoding="utf-8").read()
    book_json = json.dumps(book_ctx, ensure_ascii=False)

    for n in sorted(units):
        u = units[n]
        html = tpl.replace("/*__BOOK__*/", book_json).replace(
            "/*__DATA__*/", json.dumps(u, ensure_ascii=False)
        )
        with open(os.path.join(OUT, f"u{n}.html"), "w", encoding="utf-8") as f:
            f.write(html)
        with open(os.path.join(OUT, "data", f"u{n}.json"), "w", encoding="utf-8") as f:
            json.dump(u, f, ensure_ascii=False, indent=2)
        r = [x for x in rows if x[0] == n][0]
        extra = f"｜提高 {r[4]}" if r[4] else ""
        extra += "｜检测卷" if r[5] else ""
        print(f"  U{n} {u['unitTitle']}：知识点 {len(u['knowledgePoints'])}｜题 {r[3]}{extra}")

    # 期中检测
    if mid:
        errs2 = validate({0: mid})
        if errs2:
            print("期中卷校验失败：")
            for e in errs2:
                print("  -", e)
            sys.exit(1)
        html = tpl.replace("/*__BOOK__*/", book_json).replace(
            "/*__DATA__*/", json.dumps(mid, ensure_ascii=False))
        with open(os.path.join(OUT, "midterm.html"), "w", encoding="utf-8") as f:
            f.write(html)
        with open(os.path.join(OUT, "data", "midterm.json"), "w", encoding="utf-8") as f:
            json.dump(mid, f, ensure_ascii=False, indent=2)
        pp = sum(len(s["questions"]) for s in mid["paper"]["sections"])
        print(f"  期中 {mid['unitTitle']}：{pp} 题｜满分 {mid['paper']['totalScore']}")

    # 期末检测
    if fin:
        errs3 = validate({-1: fin})
        if errs3:
            print("期末卷校验失败：")
            for e in errs3:
                print("  -", e)
            sys.exit(1)
        html = tpl.replace("/*__BOOK__*/", book_json).replace(
            "/*__DATA__*/", json.dumps(fin, ensure_ascii=False))
        with open(os.path.join(OUT, "final.html"), "w", encoding="utf-8") as f:
            f.write(html)
        with open(os.path.join(OUT, "data", "final.json"), "w", encoding="utf-8") as f:
            json.dump(fin, f, ensure_ascii=False, indent=2)
        pf = sum(len(s["questions"]) for s in fin["paper"]["sections"])
        print(f"  期末 {fin['unitTitle']}：{pf} 题｜满分 {fin['paper']['totalScore']}")

    # 错题本
    rv_path = os.path.join(BASE, "template_review.html")
    if os.path.exists(rv_path):
        rv = open(rv_path, encoding="utf-8").read().replace("/*__BOOK__*/", book_json)
        with open(os.path.join(OUT, "review.html"), "w", encoding="utf-8") as f:
            f.write(rv)
        print("  错题本 review.html")

    # 目录页
    tpl_i = open(os.path.join(BASE, "template_index.html"), encoding="utf-8").read()
    units_ctx = []
    for num, title in ALL_UNITS:
        if num in units:
            u = units[num]
            kp_q = sum(len(k["questions"]) for k in u["knowledgePoints"])
            ex_q = len(u.get("exam", {}).get("questions", []))
            pp_q = sum(len(s.get("questions", [])) for s in u.get("paper", {}).get("sections", []))
            adv_q = sum(1 for k in u["knowledgePoints"] for q in k["questions"] if q.get("level") == "advance")
            units_ctx.append({
                "n": num,
                "title": title,
                "kp": len(u["knowledgePoints"]),
                "q": kp_q + ex_q + pp_q,
                "adv": adv_q,
                "v": len(u.get("videos", [])),
                "hasPaper": bool(u.get("paper")),
                "sections": "、".join(u.get("sections", [])[:4]),
                "ready": True,
            })
        else:
            units_ctx.append({"n": num, "title": title, "kp": 0, "q": 0, "adv": 0, "v": 0,
                              "hasPaper": False, "sections": "内容待搭建", "ready": False})

    html_i = tpl_i.replace("/*__BOOK__*/", book_json).replace(
        "/*__UNITS__*/", json.dumps(units_ctx, ensure_ascii=False)
    )
    with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_i)

    print(f"\n完成：{len(units)} 个单元，合计 {total_q} 道题")
    print("输出目录：", OUT)


if __name__ == "__main__":
    build()
