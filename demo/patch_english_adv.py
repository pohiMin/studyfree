# -*- coding: utf-8 -*-
"""英语分层：每个知识点追加 1 道提高题 + 1 道挑战题"""
import io, importlib.util, json

def load_unit(n):
    p = "english-g3up/content/u%d.py" % n
    spec = importlib.util.spec_from_file_location("m", p)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m.UNIT

ADV = {
1: {
"打招呼：Hello! / Hi! / Good morning.": [
 {"type":"choice","level":"advance","difficulty":2,"question":"晚上 8 点和爸爸说：",
  "options":["Good night, Dad.","Good morning, Dad.","Good afternoon."],"answer":"A",
  "explanation":"睡前道别用 Good night.；注意它不是问好语，是道别语。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"一天中说三次问候：早上 Good morning.，下午 Good ______.，晚上睡前 Good night.",
  "answer":"afternoon","explanation":"一天三段：morning → afternoon → (evening/night)。"},
],
"自我介绍：I'm…（I am…）": [
 {"type":"choice","level":"advance","difficulty":2,"question":"把 I am Su Hai. 改成缩写形式：",
  "options":["I'm Su Hai.","Im Su Hai.","I Su Hai."],"answer":"A",
  "explanation":"缩写要加撇号：I'm。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"填对话：—Hello! —Hi, I'm Bobby. ______ —I'm Sam.",
  "answer":"What's your name?","explanation":"对方介绍了自己，反过来问对方的名字。"},
],
"字母 Aa Bb Cc Dd": [
 {"type":"choice","level":"advance","difficulty":2,"question":"字母歌里紧跟在 A 后面唱的是：",
  "options":["B","C","D"],"answer":"A","explanation":"A B C D，按顺序。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"填字母：A ____ C ____（按顺序填两个大写字母，格式：B和D）",
  "answer":"B和D","explanation":"A B C D：A 后面是 B，C 后面是 D。"},
],
"认识课文里的新朋友": [
 {"type":"choice","level":"advance","difficulty":2,"question":"把认识新朋友的三步排对：① 介绍自己 ② 打招呼 ③ 问对方名字",
  "options":["②①③","①②③","③②①"],"answer":"A",
  "explanation":"先打招呼，再介绍自己，然后问对方名字。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"编一段完整对话：—Hi! I'm Beibei. —____（填一句：问好并介绍自己）",
  "answer":"Hi, Beibei. I'm Sam.","explanation":"答案不唯一。关键是回应问候并介绍自己。"},
],
},
2: {
"问名字：What's your name?": [
 {"type":"choice","level":"advance","difficulty":2,"question":"What's your name? 读的时候句尾要：",
  "options":["用升调，显得友好","用降调，显得凶","不读出来"],"answer":"A",
  "explanation":"一般疑问句和礼貌问句用升调。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"填对话：—____? —My name is Mike.",
  "answer":"What's your name","explanation":"根据回答 My name is… 反推问句是问名字的。"},
],
"认识新同学": [
 {"type":"choice","level":"advance","difficulty":2,"question":"新同学一个人站在门口，最好的做法是：",
  "options":["主动说 Hello! 欢迎他","当作没看见","跟别人说他"], "answer":"A",
  "explanation":"主动友爱，友谊从第一句话开始。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"对新同学说三句话（按顺序）：Hello! → What's your name? → ______",
  "answer":"Welcome to our class!","explanation":"答案不唯一：欢迎、邀请一起玩都合适。"},
],
"字母 Ee Ff Gg": [
 {"type":"choice","level":"advance","difficulty":2,"question":"下面按字母表顺序排对的一组是：",
  "options":["D E F","E D F","F E D"],"answer":"A","explanation":"D E F 按顺序。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"从 A 背到 G：A B C D E ____ ____（按「字母1和字母2」格式填）",
  "answer":"F和G","explanation":"A B C D E F G。"},
],
"读课文对话：交换名字": [
 {"type":"choice","level":"advance","difficulty":2,"question":"—What's your name? —My name is Beibei. —____",
  "options":["Hi, Beibei!","Goodbye!","I'm fine."],"answer":"A",
  "explanation":"知道名字后叫出来，是最友好的回应。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"和同桌练对话，你问完名字后对方没听清，你该说：",
  "options":["再说一遍：What's your name?","不说话了","说别的"],"answer":"A",
  "explanation":"对方没听清就再问一遍，有耐心才有朋友。"},
],
},
3: {
"确认身份：Are you…?": [
 {"type":"choice","level":"advance","difficulty":2,"question":"—Are you Liu Tao? —____（不是，我是王兵）",
  "options":["No, I'm not. I'm Wang Bing.","Yes, I am.","No, I'm Liu Tao."],"answer":"A",
  "explanation":"否定后还可以补充自己的真实身份，对话更完整。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"填肯定回答（注意语法要点）：—Are you Jake? —Yes, ______",
  "answer":"I am","explanation":"肯定回答必须用完整形式 I am，不能用缩写。"},
],
"he 和 she：他和她": [
 {"type":"choice","level":"advance","difficulty":2,"question":"She's Yang Ling. 的意思是：",
  "options":["她是杨玲。","他是杨玲。","我是杨玲。"],"answer":"A",
  "explanation":"she：她。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"填 he 或 she：____ is my mother.（指妈妈）",
  "answer":"she","explanation":"妈妈是女性，用 she。"},
],
"字母 Hh Ii Jj Kk": [
 {"type":"choice","level":"advance","difficulty":2,"question":"下面读音不同的一组是：",
  "options":["G 和 J","B 和 D 的读音","H 和 K 的发音首字母"],"answer":"A",
  "explanation":"G [dʒi:] 和 J [dʒeɪ] 读音不同，B、D 读音 [bi:][di:] 相近但不同——最容易混的是 G 和 J。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"倒背：K J ____ H（填大写）","answer":"I",
  "explanation":"正序 H I J K，倒序 K J I H。"},
],
"进一步了解新朋友": [
 {"type":"choice","level":"advance","difficulty":2,"question":"认识新朋友后想多了解他，可以问：",
  "options":["Are you nine, too?","Bye!","What?"],"answer":"A",
  "explanation":"通过问句多了解对方，友谊加深。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"写三步对话：① Hi! I'm Mike. ② ______ ③ Yes, I am.",
  "answer":"Are you Su Hai?","explanation":"③ 是肯定回答，说明 ② 是 Are you…? 的问句。"},
],
},
4: {
"介绍朋友：This is…": [
 {"type":"choice","level":"advance","difficulty":2,"question":"把两个朋友互相介绍，正确顺序是：",
  "options":["先介绍 A 给 B，再让 A 和 B 问好","让 A 自己说","不介绍"],"answer":"A",
  "explanation":"介绍完要留出两人互相问好的机会。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"把老师介绍给爸爸：—Dad, ______ my teacher, Miss Li.",
  "answer":"this is","explanation":"This is… 介绍人的万能句。"},
],
"初次见面的问候：Nice to meet you.": [
 {"type":"choice","level":"advance","difficulty":2,"question":"Nice to meet you, too. 里的 too 可以换成：",
  "options":["also（也），但 too 更常用","two（二）","to"],"answer":"A",
  "explanation":"too 也、also 也，意思一样，too 更口语。注意和 two（二）、to（到）区分。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"填对话：—Mum, this is my friend. —Nice to meet you. —____",
  "answer":"Nice to meet you, too","explanation":"朋友回应妈妈的问候，要加 too。"},
],
"字母 Ll Mm Nn": [
 {"type":"choice","level":"advance","difficulty":2,"question":"M 和 N 读音相近，区分它们最好的办法是：",
  "options":["多听多读，注意尾音 em 和 en","随便猜","只看口型"],"answer":"A",
  "explanation":"多听多读是最有效的区分方法。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"填字母：K ____ M N（填大写）","answer":"L",
  "explanation":"K L M N。"},
],
"介绍场景：在家和在学校": [
 {"type":"choice","level":"advance","difficulty":2,"question":"This is my dad. 和 This is my teacher. 说明 This is… 后面可以接：",
  "options":["各种人物","只能接朋友","只能接家人"],"answer":"A",
  "explanation":"This is… 是万能介绍句。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"介绍完说：____ to meet you! 由被介绍的人说。",
  "answer":"nice","explanation":"被介绍后双方互道 Nice to meet you.。"},
],
},
5: {
"家庭成员的单词": [
 {"type":"choice","level":"advance","difficulty":2,"question":"father 和 mother 的合称（父母的英语）是：",
  "options":["parents","parent","friend"],"answer":"A",
  "explanation":"parents：父母两人。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"写出你家的三口（按「词、词、词」格式填：father、mother 和 我）",
  "answer":"father、mother、me","explanation":"答案因人而异：介绍家人用 father/mother/brother/sister/me。"},
],
"问家人是谁：Who's she/he?": [
 {"type":"choice","level":"advance","difficulty":2,"question":"—Who's he? —____（指你的哥哥）",
  "options":["He's my brother.","She's my sister.","I'm nine."],"answer":"A",
  "explanation":"问 he 答 he。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"填对话：—Who's she? —____ my grandma.（填两个词的缩写）",
  "answer":"she's","explanation":"She's my grandma. 她是我的奶奶。"},
],
"介绍我的家人": [
 {"type":"choice","level":"advance","difficulty":2,"question":"介绍全家的正确顺序是：",
  "options":["先说 This is my family.，再逐个介绍，最后说 This is me.","先说 This is me.","没有顺序"],"answer":"A",
  "explanation": "总起 → 分说 → 收尾。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"把介绍全家的四句连起来（第一句已给）：This is my family. → He's my father. → She's my mother. → ______",
  "answer":"This is me.","explanation":"最后介绍自己。"},
],
"字母复习：Aa—Nn 与 O 开头": [
 {"type":"choice","level":"advance","difficulty":2,"question":"从 N 往后数第三个字母是：",
  "options":["Q","O","M"],"answer":"A",
  "explanation":"N O P Q：Q 是 N 后面第三个。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"倒背 A 到 N 的最后三个：____、____、____（按「字母1和字母2和字母3」格式填）",
  "answer":"N、M、L","explanation":"倒序：N M L K…最后三个是 N、M、L（从 N 往回数）。"},
],
},
6: {
"确认家人：Is he…? / Is she…?": [
 {"type":"choice","level":"advance","difficulty":2,"question":"—Is she your aunt? —____（是的）",
  "options":["Yes, she is.","Yes, she's.","Yes, she isn't."],"answer":"A",
  "explanation":"肯定回答用完整形式。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"填对话：—Is he your uncle? —No, ______. He's my father's friend.",
  "answer":"he isn't","explanation":"否定回答 No, he isn't.，再补充说明他是谁。"},
],
"家人的称呼与家谱": [
 {"type":"choice","level":"advance","difficulty":2,"question":"father 的 brother 是你的：",
  "options":["uncle","aunt","grandpa"],"answer":"A",
  "explanation":"爸爸的兄弟是叔叔或伯伯，都是 uncle。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"家谱三层，中间一层有 father、mother 和 ____、____。（按「词1和词2」格式填）",
  "answer":"uncle和aunt","explanation":"中间一层是父母辈：father、mother、uncle、aunt。"},
],
"我的家：用英语说一说": [
 {"type":"choice","level":"advance","difficulty":2,"question":"介绍全家时说 Look! 的作用是：",
  "options":["提醒别人看","提醒别人听","说再见"],"answer":"A",
  "explanation":"Look!：看！引起注意。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"连句成段：This is my family. → She's my mother. → He's my father. → ______（最后一句）",
  "answer":"This is me.","explanation":"介绍完家人最后介绍自己。"},
],
"字母滚动：Oo Pp Qq 认读": [
 {"type":"choice","level":"advance","difficulty":2,"question":"P 和 Q 的区别是：",
  "options":["Q 有小尾巴，P 没有","没有区别","P 有小尾巴"],"answer":"A",
  "explanation":"Q 是 O 加尾巴；P 是竖线加半圆。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"按顺序填：N O ____ Q（填大写）","answer":"P",
  "explanation":"N O P Q。"},
],
},
7: {
"生日祝福：Happy Birthday!": [
 {"type":"choice","level":"advance","difficulty":2,"question":"同学收到你的礼物说 Thank you! 你接着说：",
  "options":["You're welcome!","Goodbye!","What?"],"answer":"A",
  "explanation":"You're welcome! 不客气——回应感谢的礼貌用语。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"完整生日对话排序：① Thank you! ② Happy Birthday! ③ This is for you.",
  "answer":"②①③","explanation":"先祝福→道谢→再送礼物→再道谢。"},
],
"问年龄：How old are you?": [
 {"type":"choice","level":"advance","difficulty":2,"question":"问妹妹（5 岁）几岁，她说：",
  "options":["I'm five.","I'm six.","I five."],"answer":"A",
  "explanation":"I'm + 数字。five：五。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"你十岁，回答 How old are you?（填完整句子）",
  "answer":"I'm ten.","explanation":"I'm ten. 我十岁。"},
],
"数字 one 到 ten": [
 {"type":"choice","level":"advance","difficulty":2,"question":"seven 和 nine 中间的数：",
  "options":["eight","six","ten"],"answer":"A",
  "explanation":"7 8 9：seven eight nine。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"倒着数：ten nine ____ seven（填英语单词）",
  "answer":"eight","explanation":"10 9 8 7：ten nine eight seven。"},
],
"生日聚会场景对话": [
 {"type":"choice","level":"advance","difficulty":2,"question":"生日会上想问寿星几岁，礼貌的问法是：",
  "options":["How old are you?","How are you?","Who are you?"],"answer":"A",
  "explanation":"How old are you? 问年龄。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"编完整生日对话：—Happy Birthday! —Thank you! —How old are you? —____（你九岁）",
  "answer":"I'm nine.","explanation":"回答年龄：I'm nine.。"},
],
},
8: {
"我能做：I can…": [
 {"type":"choice","level":"advance","difficulty":2,"question":"—Can you swim? —____（会，但游得不好）",
  "options":["Yes, I can.","No, I can't.","I swim."],"answer":"A",
  "explanation":"会就是 Yes, I can.，游得好不好另说。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"写出三件你会做的事（按「句、句、句」格式，都用 I can 开头）",
  "answer":"I can sing. I can run. I can draw.","explanation":"答案不唯一。can 后面跟动词原形。"},
],
"为你做：I can… for you.": [
 {"type":"choice","level":"advance","difficulty":2,"question":"想帮妈妈做家务，说：",
  "options":["I can clean the room for you.","I can clean the room for I.","You can clean for me."],"answer":"A",
  "explanation":"for you：为你。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"帮朋友拿书说：I can carry the books for ______.（填人称代词）",
  "answer":"you","explanation":"for you：为你。"},
],
"夸夸自己和朋友": [
 {"type":"choice","level":"advance","difficulty":2,"question":"朋友失败了很难过，你说：",
  "options":["You can do it! Try again!","You can't.","Bye!"],"answer":"A",
  "explanation":"鼓励朋友再试一次。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"夸朋友跑得快（填完整句子）：____ can run fast!",
  "answer":"You","explanation":"You can run fast! 你能跑得快。"},
],
"字母收官：Rr—Zz": [
 {"type":"choice","level":"advance","difficulty":2,"question":"26 个字母正着背和倒着背都熟了，字母表一共：",
  "options":["26 个","24 个","28 个"],"answer":"A",
  "explanation":"26 个字母。"},
 {"type":"input","level":"challenge","difficulty":3,"question":"写出字母表最后四个（大写，按顺序）",
  "answer":"W X Y Z","explanation":"…W X Y Z。"},
],
},
}

for n in [1,2,3,4,5,6,7,8]:
    p = "english-g3up/content/u%d.py" % n
    h = io.open(p, encoding="utf-8").read()
    if "_kp_adv" in h:
        print("u%d 已有分层题，跳过" % n)
        continue
    u = load_unit(n)
    titles = [k["title"] for k in u["knowledgePoints"]]
    adv_data = {}
    for t, qs in ADV[n].items():
        if t in titles:
            adv_data[t] = qs
        else:
            print("  !! u%d 标题不匹配: %s" % (n, t))
    if not adv_data:
        print("u%d 无匹配！" % n)
        continue
    lines = ["", "# ---- 难度分层增补（2026-10-27）：提高题 + 挑战题 ----", "_kp_adv = {"]
    for title, qs in adv_data.items():
        lines.append('    "%s": [' % title)
        for q in qs:
            lines.append('        ' + json.dumps(q, ensure_ascii=False) + ',')
        lines.append('    ],')
    lines.append("}")
    lines.append('for _kp in UNIT["knowledgePoints"]:')
    lines.append('    _a = _kp_adv.get(_kp["title"])')
    lines.append("    if _a:")
    lines.append('        _kp["questions"].extend(_a)')
    h += "\n".join(lines) + "\n"
    io.open(p, "w", encoding="utf-8").write(h)
    print("u%d 追加 %d 组 / %d 题" % (n, len(adv_data), sum(len(v) for v in adv_data.values())))
