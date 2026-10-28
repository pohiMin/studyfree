# -*- coding: utf-8 -*-
"""交互回归测试：注入自动答题脚本，检查判定、反馈、进度、检测卷计分"""
import os, subprocess, re, glob

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

_SEED_JS = r"""<script>try{localStorage.setItem("studyfree.session.v1",JSON.stringify({name:"测试甲",ts:Date.now()}))}catch(e){}</script>"""

JS = r"""
<script>
setTimeout(function(){
  try{
    var out=[];
    var qs=[].slice.call(document.querySelectorAll(".q"));
    var cq=qs.filter(function(q){return q.querySelector(".opt");})[0];
    var iq=qs.filter(function(q){return q.querySelector("input");})[0];
    var tq=qs.filter(function(q){return q.querySelectorAll(".opt").length===2;})[0];

    if(cq){
      var os=cq.querySelectorAll(".opt"), want=cq.getAttribute("data-ans");
      for(var i=0;i<os.length;i++){ if(os[i].getAttribute("data-val")===want){ os[i].click(); break; } }
      out.push("选择:"+(cq.querySelector(".fb").textContent.indexOf("答对了")>-1?"PASS":"FAIL"));
    }
    if(tq){
      var os2=tq.querySelectorAll(".opt"), want2=tq.getAttribute("data-ans");
      for(var j=0;j<os2.length;j++){ if(os2[j].getAttribute("data-val")===want2){ os2[j].click(); break; } }
      out.push("判断:"+(tq.querySelector(".fb").textContent.indexOf("答对了")>-1?"PASS":"FAIL"));
    }
    if(iq){
      var inp=iq.querySelector("input"), right=iq.getAttribute("data-ans");
      inp.value="__WRONG__"; iq.querySelector(".btn").click();
      var f1=iq.querySelector(".fb").textContent;
      out.push("填空错答:"+(f1.indexOf("再想想")>-1 && f1.indexOf(right)>-1 ?"PASS":"FAIL"));
    }

    // 检测卷：开始检测 → 全部答对 → 交卷，验证满分
    var ps=document.getElementById("paperStart");
    if(ps){
      ps.click();
      var pqs=[].slice.call(document.querySelectorAll("#pane-paper .q"));
      pqs.forEach(function(q){
        var ans=q.getAttribute("data-ans");
        var opts=q.querySelectorAll(".opt");
        if(opts.length){
          for(var k=0;k<opts.length;k++){ if(opts[k].getAttribute("data-val")===ans){ opts[k].click(); break; } }
        } else {
          var ip=q.querySelector("input");
          if(ip){ ip.value=ans; ip.dispatchEvent(new Event("input")); }
        }
      });
      var sub=document.getElementById("paperSubmit");
      if(sub) sub.click();
      var sc=document.querySelector("#paperResult .sc");
      var txt=sc?sc.textContent:"";
      var m=txt.match(/(\d+)\s*\/\s*(\d+)/);
      out.push("检测卷("+pqs.length+"题):"+(m && m[1]===m[2] ? "PASS("+m[1]+"/"+m[2]+")" : "FAIL("+txt.slice(0,30)+")"));
    }

    out.push(document.getElementById("ptxt").textContent);
    document.title="TEST::"+out.join(" | ");
  }catch(e){ document.title="TEST::ERR "+e.message; }
},200);
</script>
"""

def run(html_path):
    h = open(html_path, encoding="utf-8").read()
    h = h.replace("<head>", "<head>" + _SEED_JS, 1)
    h = h.replace("</body>", JS + "</body>")
    tmp = os.path.join(OUT, "_probe.html")
    open(tmp, "w", encoding="utf-8").write(h)
    r = subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--no-sandbox",
                        "--virtual-time-budget=8000", "--dump-dom",
                        "file:///" + tmp.replace("\\", "/")],
                       capture_output=True, text=True, encoding="utf-8", errors="ignore")
    try:
        os.remove(tmp)
    except OSError:
        pass
    m = re.search(r"<title>([^<]*)</title>", r.stdout)
    return m.group(1) if m else "(无标题)"

if __name__ == "__main__":
    files = sorted(glob.glob(os.path.join(OUT, "u*.html")),
                   key=lambda p: int(re.search(r"u(\d+)\.html", p).group(1)))
    allpass = True
    for f in files:
        res = run(f)
        bad = ("FAIL" in res) or ("ERR" in res)
        if bad: allpass = False
        print(("OK  " if not bad else "!!  ") + os.path.basename(f) + "  " + res)
    print("\n总体：", "全部通过" if allpass else "存在失败项")
