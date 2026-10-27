# -*- coding: utf-8 -*-
"""三科题目数据全面扫描：题干残留、双空怪题、选项重复、答案异常"""
import os, sys, glob, importlib.util

def load(path):
    name = os.path.splitext(os.path.basename(path))[0]
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return getattr(mod, "UNIT")

issues = []
def flag(sev, subj, tag, msg):
    issues.append((sev, subj, tag, msg))

for subj, d in [("语文","chinese-g3up"), ("英语","english-g3up"), ("数学","math-g3up")]:
    for path in sorted(glob.glob(d + "/content/*.py")):
        try:
            u = load(path)
        except Exception as e:
            flag("ERROR", subj, os.path.basename(path), "加载失败 " + str(e))
            continue
        un = u.get("unitNumber"); ut = u.get("unitTitle")
        tag0 = f"U{un} {ut}"

        def check_q(q, where):
            qn = str(q.get("question",""))
            ans = str(q.get("answer",""))
            # 1) 题干残留的编辑说明
            for bad in ["不对，请", "——不对", "等等——", "（填课文原句）题", "占位", "TODO", "XXX", "placeholder"]:
                if bad in qn:
                    flag("HIGH", subj, where, f"题干残留「{bad}」：{qn[:50]}")
            # 2) input 双空/多空答案（空格分隔）
            if q.get("type") == "input":
                if " " in ans.strip() and len(ans.split()) > 1 and q.get("unit") is None:
                    if "　" not in qn or "两" not in qn:  # 未声明两空的
                        flag("MED", subj, where, f"填空答案含空格「{ans}」：{qn[:44]}")
                if len(ans) >= 4 and qn.count("____") == 0 and "（" not in qn:
                    flag("LOW", subj, where, f"填空题干无空位标记：{qn[:44]}")
            # 3) 选项重复
            if q.get("type") == "choice":
                opts = q.get("options", [])
                if len(set(opts)) != len(opts):
                    flag("HIGH", subj, where, f"选项重复：{opts}")
                if ans not in "ABCDEF"[:len(opts)]:
                    flag("HIGH", subj, where, f"答案越界 {ans} / {len(opts)}")
                # 选项长度悬殊（暗示正确答案）
                if len(opts) >= 3:
                    ls = [len(o) for o in opts]
                    if max(ls) - min(ls) >= 14:
                        flag("LOW", subj, where, f"选项长度悬殊(可能泄露答案)：{opts}")
            # 4) 解析与答案不一致（解析里应含答案关键词——仅抽查 input）
            if q.get("type") == "input" and q.get("explanation"):
                if ans and ans not in q["explanation"] and len(ans) <= 6:
                    flag("LOW", subj, where, f"解析未复述答案「{ans}」：{q['explanation'][:40]}")

        for ki, kp in enumerate(u.get("knowledgePoints", [])):
            for qi, q in enumerate(kp.get("questions", [])):
                check_q(q, f"{tag0}/{kp['title']}/Q{qi+1}")
        ex = u.get("exam") or {}
        for qi, q in enumerate(ex.get("questions", []) or []):
            check_q(q, f"{tag0}/自测/Q{qi+1}")
        pa = u.get("paper")
        if pa:
            for si, sec in enumerate(pa.get("sections", [])):
                for qi, q in enumerate(sec.get("questions", [])):
                    check_q(q, f"{tag0}/卷/{sec['name']}/Q{qi+1}")

sev_order = {"ERROR":0, "HIGH":1, "MED":2, "LOW":3}
issues.sort(key=lambda x: sev_order[x[0]])
for sev, subj, tag, msg in issues:
    print(f"[{sev}] {subj} {tag} | {msg}")
print(f"\n共 {len(issues)} 条（HIGH {sum(1 for i in issues if i[0]=='HIGH')} / MED {sum(1 for i in issues if i[0]=='MED')} / LOW {sum(1 for i in issues if i[0]=='LOW')}）")
