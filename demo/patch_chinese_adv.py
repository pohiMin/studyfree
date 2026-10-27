# -*- coding: utf-8 -*-
"""语文分层：每个知识点追加 2 道提高题 + 1 道挑战题（按单元+标题匹配）"""
import io, importlib.util, json

def load_unit(n):
    p = "chinese-g3up/content/u%d.py" % n
    spec = importlib.util.spec_from_file_location("m", p)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m.UNIT

# {单元号: {知识点标题: [题...]}}
ADV = {
1: {
"有新鲜感的词句": [
 {"type":"choice","level":"advance","difficulty":3,"question":"下面哪个句子用了和《花的学校》一样的写法（把物当人写）？",
  "options":["小溪一路唱着歌跑下山。","小溪的水很清。","小溪在山谷里。"],"answer":"A",
  "explanation":"『唱着歌』『跑』是人做的事，把小溪当成人写，与课文写东风『吹着口笛』同一写法。"},
 {"type":"input","level":"advance","difficulty":3,"question":"把『星星在天上眨眼睛』改成没有新鲜感的普通说法：星星在天上____。（填两个字）",
  "answer":"闪烁","explanation":"『眨眼睛』有新鲜感，『闪烁』是普通说法。反过来练，能看清两种写法的差别。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"仿写一句把风当成人来写的句子（10 字以内，如：风在耳边说悄悄话）。",
  "answer":"风在耳边说悄悄话","explanation":"答案不唯一。只要把风写出人的动作或语言，就算对。"},
],
"边读边想象画面": [
 {"type":"choice","level":"advance","difficulty":3,"question":"读『同学们向在校园里欢唱的小鸟打招呼』，你脑中出现的画面最不可能包括：",
  "options":["小鸟看着乐谱唱歌","同学们开心地招手","校园里的大青树"],"answer":"A",
  "explanation":"『欢唱』让人听到声音、看到同学打招呼的样子，但不会有真的乐谱——想象要贴着文字。"},
 {"type":"input","level":"advance","difficulty":3,"question":"读『古老的铜钟，挂在大青树粗壮的枝干上』，用一句话说出画面（10 字以内）。",
  "answer":"大树上挂着一口旧钟","explanation":"写出画面即可，关键是抓住『粗壮的树』『旧的钟』。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"闭上眼睛听老师读《大青树下的小学》第二自然段，把你『看到』的画面写下来（15 字以内）。",
  "answer":"少数民族孩子穿着鲜艳服装上学","explanation":"答案不唯一，只要画面来自课文文字即可。"},
],
"抓特点写人（习作：猜猜他是谁）": [
 {"type":"choice","level":"advance","difficulty":3,"question":"要写『热心的同桌』，下面哪个材料最合适？",
  "options":["我的橡皮丢了，他翻遍整个书包帮我找","他个子很高","他喜欢吃糖"],"answer":"A",
  "explanation":"事例要直接证明特点。『翻遍书包帮忙找』正是热心的表现。"},
 {"type":"input","level":"advance","difficulty":3,"question":"写『爱看书的爸爸』，光说『他爱看书』没有说服力。请补一个具体场景（填：深夜还____）。",
  "answer":"深夜还在台灯下看书","explanation":"答案不唯一，关键是写出具体做什么，让『爱看书』看得见。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"写一段 30 字左右的话，只通过动作表现『奶奶很慈祥』，不许出现『慈祥』两个字。（示例填：她笑着帮我把面条吹凉）",
  "answer":"她笑着帮我把面条吹凉","explanation":"答案不唯一。只用动作和神态让读者自己得出结论，这是写人的高级本领。"},
],
"略读课文怎么读": [
 {"type":"choice","level":"advance","difficulty":3,"question":"读完《不懂就要问》，用自己的话说课文主要内容，最好的说法是：",
  "options":["孙中山读书不懂就问，宁可挨打也要弄懂道理","孙中山背书很厉害","先生打人了"],"answer":"A",
  "explanation":"概括主要内容要抓住人物和事情的关键，不要只抓细节。"},
 {"type":"input","level":"advance","difficulty":3,"question":"略读课文读完以后，最好做的一件事是：把故事讲给____听。（填两个字）","answer":"别人",
  "explanation":"能讲给别人听，才说明真正读懂了。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"读略读课文时遇到不认识的字可以跳过去。想一想：什么时候必须停下来查？（填：影响____意思的时候）",
  "answer":"理解","explanation":"个别生字可跳过；但影响理解大意的字词要停下来弄懂——跳与不跳，看它重不重要。"},
],
"字词基础：本单元易读错写错的字": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『穿戴不同』的『穿戴』：戴帽子用____，把东西____来。",
  "options":["戴、带","带、戴","戴、戴"],"answer":"A",
  "explanation":"戴是穿戴在身上（戴帽、戴红领巾）；带是拿来带去（带东西）。"},
 {"type":"input","level":"advance","difficulty":3,"question":"『粗壮』的反义词是____。（填两个字）","answer":"细弱",
  "explanation":"粗对细、壮对弱。找反义词也是理解词语的方法。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"写出两个带『影』字的词语（按「词语、词语」格式填，如：影子、影响）。",
  "answer":"影子、影响","explanation":"答案不唯一：影子、影响、背影、摄影都可以。"},
],
},
2: {
"古诗三首：从景物读懂秋天": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『萧萧梧叶送寒声』里的『寒』字，让你感觉到：",
  "options":["秋天夜晚的凉意和诗人心里的冷清","天气马上要下雪了","诗人很怕冷"],"answer":"A",
  "explanation":"一个『寒』字既是身体的感受，也是心里的孤独，这叫一字传情。"},
 {"type":"input","level":"advance","difficulty":3,"question":"《赠刘景文》先写荷、菊凋残，再写橙黄橘绿。先抑后扬是为了____朋友。（填两个字）",
  "answer":"鼓励","explanation":"先写衰败，再指出最好的景致，是劝朋友乐观——这是鼓励的诗。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"《夜书所见》里诗人『夜书所见』，他『见』到的景物是：____一灯明。（按课文填四个字）",
  "answer":"夜深篱落","explanation":"诗人深夜见到篱笆下的灯火，由此想到孩子们在捉蟋蟀。"},
],
"用多种方法理解词语": [
 {"type":"choice","level":"advance","difficulty":3,"question":"理解『五彩缤纷』，下面哪种方法用错了？",
  "options":["把五个字拆开一个一个查","联系课文：秋雨把很多颜色给了植物","找近义词：五颜六色"],"answer":"A",
  "explanation":"『五彩缤纷』要整体理解，拆开单查没有意义。拆词法适合能拆的词。"},
 {"type":"input","level":"advance","difficulty":3,"question":"用『凌乱』造句：风把落叶吹得____。（填两个字，与凌乱呼应）","answer":"乱飞",
  "explanation":"答案不唯一，关键是句子要表现出『不整齐、没秩序』。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"课文里『明朗』『凌乱』都是写秋天的词。选一个，用『查字典或联系上下文』说出它的意思（填：明朗就是天气____）。",
  "answer":"晴朗","explanation":"明朗：光线充足、开阔明亮，近义词晴朗。"},
],
"写日记：格式与内容": [
 {"type":"choice","level":"advance","difficulty":3,"question":"下面这篇日记开头正确的是：",
  "options":["10月26日 星期一 晴","星期一、晴","今天天气好"],"answer":"A",
  "explanation":"日记第一行要写日期、星期、天气，内容要全。"},
 {"type":"input","level":"advance","difficulty":3,"question":"日记写『今天我学会了包饺子』，正文应重点写：怎么包的、遇到什么困难、____。（填两个字）",
  "answer":"感受","explanation":"过程加感受，日记才有味道。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"同一天发生三件事：上课被表扬、中午吃了面条、帮同学捡了橡皮。日记选哪件最值得写？（填：帮同学捡橡皮，因为这是____的事）",
  "answer":"难忘","explanation":"日记选最有感受、最难忘的事写，不选平平淡淡的。"},
],
"比喻与拟人": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『秋天的雨，是一把钥匙』和『秋雨吹起了小喇叭』，前者是____，后者是____。",
  "options":["比喻、拟人","拟人、比喻","都是拟人"],"answer":"A",
  "explanation":"『是一把钥匙』把秋雨比作钥匙，是比喻；『吹喇叭』是人的动作，是拟人。"},
 {"type":"input","level":"advance","difficulty":3,"question":"把『落叶掉下来』改成拟人句：落叶____。（填两个字以上）","answer":"跳舞",
  "explanation":"答案不唯一：跳舞、告别、回家都可以，关键是像人。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"写一个既有比喻又有拟人的句子描写『白云』（填：白云像____在天上散步）。",
  "answer":"棉花糖","explanation":"答案不唯一：棉花糖、羊群都行——『像』是比喻，『散步』是拟人，一句里两样都有。"},
],
"字词基础：秋天的字词": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『铺路』和『店铺』里的两个『铺』，读音：",
  "options":["不同：pū 和 pù","相同","都是 pù"],"answer":"A",
  "explanation":"作动词读 pū，作名词读 pù。"},
 {"type":"input","level":"advance","difficulty":3,"question":"多音字『曲』：弯曲读 qū，歌曲读____。（填拼音）","answer":"qǔ",
  "explanation":"弯曲 qū，歌曲 qǔ。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"写出三个描写秋天的四字词语（按「词、词、词」格式填）。",
  "answer":"秋高气爽、天高云淡、秋风习习","explanation":"答案不唯一：秋高气爽、天高云淡、秋风习习、五谷丰登都可以。"},
],
},
3: {
"看题目和插图预测": [
 {"type":"choice","level":"advance","difficulty":3,"question":"预测《犟龟》的结局前，你最重要的依据是：",
  "options":["题目中的『犟』字点明了乌龟的性格","乌龟爬得慢","插图上有狮子"],"answer":"A",
  "explanation":"性格决定命运——题目点出『犟』，结局一定与坚持有关。"},
 {"type":"input","level":"advance","difficulty":3,"question":"预测之后还要做的一件事是：读书时____自己的预测。（填两个字）","answer":"验证",
  "explanation":"预测→阅读验证→修正，这才是完整的策略。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"看到题目《小狗学叫》，写出你的预测和依据（填：我猜它学叫会遇到____，因为题目说它本来不会叫）。",
  "answer":"困难","explanation":"答案不唯一，关键是预测要有依据。"},
],
"跟着情节线索预测": [
 {"type":"choice","level":"advance","difficulty":3,"question":"老屋『总也倒不了』的根本原因是：",
  "options":["总有需要它的小动物来求助","它特别结实","它不想倒"],"answer":"A",
  "explanation":"每一次求助都让老屋推迟倒下——线索藏在反复的情节里。"},
 {"type":"input","level":"advance","difficulty":3,"question":"按『说困难—请求—老屋答应』的规律，如果再来一只小动物，它的结局一定是被老屋____。（填两个字）","answer":"答应",
  "explanation":"慈祥的老屋不会拒绝真心求助者——性格决定情节走向。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"老屋每次都说『好了，我到了倒下的时候了！』这句话反复出现的作用是：让故事有____，也让读者期待下一个求助者。（填两个字）",
  "answer":"节奏","explanation":"反复结构让故事有节奏感，也埋着预测的线索。"},
],
"续写故事：接着往下编": [
 {"type":"choice","level":"advance","difficulty":3,"question":"续写最怕『人物性格突变』。防止的办法是：",
  "options":["动笔前先回顾人物在前文的表现","写快点","换个新人物"],"answer":"A",
  "explanation":"回顾前文表现，让续写的人物言行和前文对得上。"},
 {"type":"input","level":"advance","difficulty":3,"question":"续写结尾前，先问自己：这个故事最后要告诉大家____。（填两个字）","answer":"什么",
  "explanation":"想清楚结尾的意思，情节就不会跑偏。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"续写《总也倒不了的老屋》：老屋倒下前，小蜘蛛会说什么？（填一句合理的话，如：老屋，谢谢你听我讲了这么多故事）",
  "answer":"老屋，谢谢你听我讲了这么多故事","explanation":"答案不唯一。关键是要符合小蜘蛛感恩、不舍的心情。"},
],
"字词基础：本单元重点字词": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『暴风雨』的『暴』和『瀑布』的『瀑』：",
  "options":["读音不同，字形不同，意思不同","完全一样","读音相同"],"answer":"A",
  "explanation":"暴 bào 与瀑 pù 读音不同：瀑布是水从高处落下。"},
 {"type":"input","level":"advance","difficulty":3,"question":"『蜘蛛』两个字都是____旁。（填一个字）","answer":"虫",
  "explanation":"虫字旁的字多与昆虫有关。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"『几乎』和『几个』的『几』读音不同。写出各自读音（按「x和y」格式填拼音）。",
  "answer":"jī和jǐ","explanation":"几乎 jī；几个 jǐ。多音字放进词里记。"},
],
},
4: {
"童话的想象：把物当人写": [
 {"type":"choice","level":"advance","difficulty":3,"question":"编一个『会走路的书包』的童话，最合理的设定是：",
  "options":["书包因为装的书太多太重，走路慢吞吞","书包会飞上月亮","书包变成大象"],"answer":"A",
  "explanation":"想象要合乎特性：书包重所以走得慢——这样的想象又大胆又合理。"},
 {"type":"input","level":"advance","difficulty":3,"question":"蟋蟀怕水，所以编蟋蟀的故事时要让它____水。（填一个字）","answer":"怕",
  "explanation":"顺着事物本来的特点编，故事才可信。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"给『台灯』编一个愿望：它最大的愿望是____。（填一句话，10 字以内）",
  "answer":"照亮小朋友写作业","explanation":"答案不唯一。愿望要符合台灯的特点（发光、照明）。"},
],
"读出童话里的人物和道理": [
 {"type":"choice","level":"advance","difficulty":3,"question":"《一块奶酪》里蚂蚁队长『犹豫了一下』这个细节说明：",
  "options":["他也想吃，但最终战胜了自己，人物更真实","他不喜欢奶酪","他饿了"],"answer":"A",
  "explanation":"写出一闪念的犹豫，再写克服它，人物才有血有肉——好童话不写完美的人。"},
 {"type":"input","level":"advance","difficulty":3,"question":"青头救红头靠的不只是勇敢，还有____。（填两个字）","answer":"冷静",
  "explanation":"勇敢加冷静，才能在关键时刻想出办法。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"如果青头当时也慌了，红头的结局会怎样？这让你明白朋友的作用是：在危难时____你。（填两个字）",
  "answer":"帮助","explanation":"答案不唯一：帮助、鼓励、提醒都可以。从反面想，更能读懂青头的可贵。"},
],
"我来编童话：三要素": [
 {"type":"choice","level":"advance","difficulty":3,"question":"童话『小水滴旅行记』的情节转折可以是：",
  "options":["小水滴被太阳蒸发上天，变成云，又变成雨落回家","小水滴不动","小水滴变成石头"],"answer":"A",
  "explanation":"转折要既意外又合理：蒸发成云再落雨，正好用了水的循环特点。"},
 {"type":"input","level":"advance","difficulty":3,"question":"编童话时，给主角设一个____，故事才有看头。（填两个字）","answer":"困难",
  "explanation":"没有困难就没有斗争，没有斗争就没有故事。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"用『铅笔、橡皮、转笔刀』三个角色编童话，写出一个可能的矛盾（填：它们在争____）。",
  "answer":"谁的功劳大","explanation":"答案不唯一：争功劳、比本领都可以——有矛盾才有故事。"},
],
"字词基础：本单元重点字词": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『偷』字是____旁，说明：",
  "options":["单人旁，与人的行为有关","车字旁，与车有关","虫字旁"],"answer":"A",
  "explanation":"看偏旁猜字义：偷是人的行为。"},
 {"type":"input","level":"advance","difficulty":3,"question":"『答』是多音字：回答读 ____,答应读 ____。（按「x和y」格式填拼音）","answer":"dá和dā",
  "explanation":"回答 dá，答应 dā。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"写出三个含『命』字的词语（按「词、词、词」格式填）。",
  "answer":"救命、生命、命令","explanation":"答案不唯一：救命、生命、命令、命运都可以。"},
],
},
5: {
"多感官观察": [
 {"type":"choice","level":"advance","difficulty":3,"question":"观察一种水果，下面四种记录里用到感官最多的是：",
  "options":["金黄的皮、摸上去有点粗糙、闻着甜香、咬一口水很多","是圆的","很好吃"],"answer":"A",
  "explanation":"看、摸、闻、尝四样全用上，观察才立体。"},
 {"type":"input","level":"advance","difficulty":3,"question":"『雨点打在船篷上沙啦沙啦响』，这句话用的感官是____。（填两个字）","answer":"听觉",
  "explanation":"响声是耳朵听到的。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"用两种感官写一句话观察『下雨』（填：雨点打在伞上沙啦响，溅到手上____）。",
  "answer":"凉凉的","explanation":"答案不唯一：凉凉的（触觉）、像小石子（视觉比喻）都可以——两种感官一起用。"},
],
"连续观察与变化记录": [
 {"type":"choice","level":"advance","difficulty":3,"question":"要观察月亮的变化，合理的记录频率是：",
  "options":["每晚同一时间记录一次，连续一个月","只记一次","每分钟记一次"],"answer":"A",
  "explanation":"固定时间、持续记录，才能看到完整的变化过程。"},
 {"type":"input","level":"advance","difficulty":3,"question":"蒲公英的花早上合拢、中午张开，这与____和阳光有关。（填两个字）","answer":"温度",
  "explanation":"课文说花朵开合与温度、阳光有关。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"设计观察绿豆发芽：除了记录变化，还要记录____，才能找到变化的原因。（填两个字）",
  "answer":"条件","explanation":"变化和条件一起记（比如水和温度），才能解释为什么变。"},
],
"抓住事物的独特之处": [
 {"type":"choice","level":"advance","difficulty":3,"question":"写『这一只』小狗，下面哪句最独特？",
  "options":["它听到门铃总会歪着头，左耳先竖起来","它是一只狗","它有四条腿"],"answer":"A",
  "explanation":"歪头竖耳是这只狗独有的习惯——独特之处才让文章有生命。"},
 {"type":"input","level":"advance","difficulty":3,"question":"写观察作文前，先问自己：它最让我____的地方是什么？（填两个字）","answer":"惊讶",
  "explanation":"惊讶的地方往往就是独特之处。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"观察你家的小猫或一个文具，写出它『只有它才有』的一个特点（填一句话）。",
  "answer":"我的台灯开关按下去会咔哒响一声","explanation":"答案不唯一。关键是这个特点是别人家的猫或别的台灯没有的。"},
],
"字词基础：本单元重点字词": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『衔起小鱼』的『衔』和『街道』的『街』，区别在：",
  "options":["中间部分不同：衔里面是金，街里面是圭","完全相同","读音相同"],"answer":"A",
  "explanation":"两个字都是行字框，里面不同：衔叼着金，街是十字路口。"},
 {"type":"input","level":"advance","difficulty":3,"question":"『翠鸟』的『翠』本义与____色有关。（填一个字）","answer":"绿",
  "explanation":"翠指青绿色的玉石，所以翠鸟羽毛是翠绿色的。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"写出三个带鸟字旁的字（按「字、字、字」格式填）。",
  "answer":"鹦、鹉、鸭","explanation":"答案不唯一：鹦、鹉、鸭、鹅、鸡都可以。"},
],
},
6: {
"找关键语句（中心句）": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『西沙群岛也是鸟的天下。』这句中心句放在段首，后面的句子应该：",
  "options":["都写海鸟的事","写海水","写珊瑚"],"answer":"A",
  "explanation":"中心句定了方向，后面的例子都要围绕它。"},
 {"type":"input","level":"advance","difficulty":3,"question":"一段话的中心句可能在段首、段中，也可能在段____。（填一个字）","answer":"尾",
  "explanation":"中心句的位置灵活，段尾总结也很常见。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"自己给一段话写中心句：写『我的文具盒』这段话的中心句（填一句话）。",
  "answer":"我的文具盒又漂亮又能装。","explanation":"答案不唯一。中心句要能统领整段内容。"},
],
"围绕一个意思写": [
 {"type":"choice","level":"advance","difficulty":3,"question":"写『海滩真热闹』，下面哪句不该出现在这段里？",
  "options":["小城的街道很干净","贝壳五颜六色","人们在捡贝壳"],"answer":"A",
  "explanation":"街道是另一段的内容，塞进来就跑题了。"},
 {"type":"input","level":"advance","difficulty":3,"question":"写完一段话，用一句话概括它。概括不出来的说明这段话缺少____。（填两个字）","answer":"中心",
  "explanation":"概括不出来，说明这段话没有统一的中心。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"围绕『下课了，操场上真热闹』，写两个具体的例子（按「例1和例2」格式简写）。",
  "answer":"跳绳的和踢毽子的","explanation":"答案不唯一。例子都要围绕『热闹』。"},
],
"按顺序写景（总分结构）": [
 {"type":"choice","level":"advance","difficulty":3,"question":"写『美丽的校园』，先写校门、再写操场、最后写教学楼，这是：",
  "options":["方位顺序（由外到内）","时间顺序","没有顺序"],"answer":"A",
  "explanation":"按空间位置移动来写，是方位顺序。"},
 {"type":"input","level":"advance","difficulty":3,"question":"《美丽的小兴安岭》按____顺序写，一年四季各有各的美。（填两个字）","answer":"时间",
  "explanation":"春夏秋冬就是时间顺序。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"写『秋天的校园』按时间顺序，你会选哪三个时间点？（按「时间1、时间2、时间3」格式填）",
  "answer":"早晨、中午、放学时","explanation":"答案不唯一。三个时间点连起来就是一天的校园。"},
],
"字词基础：山河的字词": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『富饶』的『饶』为什么是食字旁？",
  "options":["与食物丰富有关，物产多才叫富饶","写错了","随便加的"],"answer":"A",
  "explanation":"看偏旁理解字义：食物丰富就是富饶。"},
 {"type":"input","level":"advance","difficulty":3,"question":"『海参』的『参』是多音字：参加读 cān，海参读____。（填拼音）","answer":"shēn",
  "explanation":"多音字放进词里记。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"写出三个表示海产或海景的词语（按「词、词、词」格式填）。",
  "answer":"珊瑚、海滩、贝壳","explanation":"答案不唯一：珊瑚、海滩、贝壳、海龟、飞鱼都可以。"},
],
},
7: {
"古诗三首：动静结合的山水": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『两岸青山相对出』中的『出』把静的山写活了，这是因为：",
  "options":["诗人坐在船上，山随船动仿佛迎面而来","山真的在动","山会走路"],"answer":"A",
  "explanation":"动的是船，山仿佛迎面出现——以船动写山动，动静相映。"},
 {"type":"input","level":"advance","difficulty":3,"question":"《鹿柴》里『但闻人语响』的声音越大，山林越显得____。（填一个字）","answer":"静",
  "explanation":"以声衬静——声音越清楚，越显出山里的空旷寂静。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"《饮湖上初晴后雨》用西子（西施）比西湖。这个比喻好在哪里？（填：因为西湖和西子都很____）",
  "answer":"美","explanation":"答案不唯一。美是共同点：无论淡妆浓抹都好看，无论晴雨西湖都美。"},
],
"拟声词与生动的语言": [
 {"type":"choice","level":"advance","difficulty":3,"question":"写『北风呼呼地刮』用『呼呼』，好处是：",
  "options":["让读者仿佛听到了风声","字数多","显得正式"],"answer":"A",
  "explanation":"拟声词让文字有声音，读的人身临其境。"},
 {"type":"input","level":"advance","difficulty":3,"question":"描写泉水叮叮咚咚，还可以说泉水在____。（填两个字：拟人写法）","answer":"唱歌",
  "explanation":"把泉水的声音当作唱歌，是拟人加拟声的结合。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"写出两个表示动物叫声的拟声词（按「词、词」格式填）。",
  "answer":"汪汪、喵喵","explanation":"答案不唯一：汪汪、喵喵、叽叽喳喳、哞哞都可以。"},
],
"我有一个想法：提建议的方法": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『建议学校开放图书角』的理由中，最有说服力的是：",
  "options":["我观察到课间很多同学没书可读，只能干坐着","我想要新书","书很贵"],"answer":"A",
  "explanation":"用观察到的事实说明需求，理由才站得住。"},
 {"type":"input","level":"advance","difficulty":3,"question":"提建议时说清了问题，还要给出____和理由。（填两个字）","answer":"建议",
  "explanation":"问题+建议+理由，三样齐了想法才有用。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"针对『同学课间在走廊追逐打闹』写一条具体建议（填一句话）。",
  "answer":"在走廊画上靠右行的箭头，安排课间监督员","explanation":"答案不唯一。关键是具体、可行。"},
],
"字词基础：本单元重点字词": [
 {"type":"choice","level":"advance","difficulty":3,"question":"《鹿柴》的『柴』读 zhài，意思是：",
  "options":["栅栏、篱障（同『寨』）","烧火的柴","木头"],"answer":"A",
  "explanation":"鹿柴是地名，柴通寨，指栅栏。这是本单元最重要的读音点。"},
 {"type":"input","level":"advance","difficulty":3,"question":"『琴』的下面是____。（填一个字）","answer":"今",
  "explanation":"琴字下面是今，不是令，写的时候注意。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"写出三个拟声词，分别写风声、雨声、雷声（按「风、雨、雷」格式填）。",
  "answer":"呼呼、滴滴答答、轰隆隆","explanation":"答案不唯一。注意拟声词要符合事物的声音特点。"},
],
},
8: {
"文言文初识：《司马光》": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『光持石击瓮破之』中『之』代指的是：",
  "options":["瓮","司马光","石头"],"answer":"A",
  "explanation":"击破的是瓮，之代指瓮。文言文的之常代指前文说过的东西。"},
 {"type":"input","level":"advance","difficulty":3,"question":"把『群儿戏于庭』翻译成现代的话：一群孩子在____玩耍。（填两个字）","answer":"庭院",
  "explanation":"庭就是庭院。文言文一个字常常就是一个词。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"『众皆弃去』和『光持石击瓮』形成了对比。这个对比的作用是：突出司马光的____。（填两个字）",
  "answer":"冷静","explanation":"答案不唯一：冷静、勇敢、机智都可以。别人跑他不跑，对比让人物突出。"},
],
"带着问题默读": [
 {"type":"choice","level":"advance","difficulty":3,"question":"默读《手术台就是阵地》前，先看课后问题『白求恩为什么坚守手术台』，这样做的好处是：",
  "options":["带着问题读，读的时候更有方向","少读几段","不用读了"],"answer":"A",
  "explanation":"带着问题默读，读和想同时进行，效率高。"},
 {"type":"input","level":"advance","difficulty":3,"question":"默读后检验自己的方法是：合上书，用自己的话____。（填两个字）","answer":"说说",
  "explanation":"能复述才算真读懂。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"默读比朗读快，是因为省去了____和看字的时间。（填两个字）",
  "answer":"发音","explanation":"默读不出声，省去发音时间，速度自然更快。"},
],
"用具体事例写人": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『一定要争气』里童第周争气的事例是：",
  "options":["天不亮就起床读书，成绩从倒数追到前列","跟人比赛跑步","考试作弊"],"answer":"A",
  "explanation":"用具体做法证明『争气』，人物才立得住。"},
 {"type":"input","level":"advance","difficulty":3,"question":"写『那次经历真难忘』，最能让读者感同身受的是当时的____。（填两个字）","answer":"感受",
  "explanation":"写出手抖、心跳这些细节和感受，读者就像亲身经历。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"用一件事表现『妈妈很辛苦』（填一句话，要有具体动作）。",
  "answer":"妈妈下班回来还要弯着腰拖地，额头上的汗都顾不上擦","explanation":"答案不唯一。关键是动作要具体，让辛苦看得见。"},
],
"字词基础：本单元重点字词": [
 {"type":"choice","level":"advance","difficulty":3,"question":"『战斗』的『斗』读 dòu，那么『北斗星』的『斗』读：",
  "options":["dǒu","dòu","dōu"],"answer":"A",
  "explanation":"量粮食的斗、北斗星读 dǒu；打架、战斗读 dòu。"},
 {"type":"input","level":"advance","difficulty":3,"question":"『瓮』是口小肚大的____器。（填一个字）","answer":"陶",
  "explanation":"瓮是陶制的容器，所以字里有瓦字底。"},
 {"type":"input","level":"challenge","difficulty":4,"question":"给『弃』组三个词（按「词、词、词」格式填）。",
  "answer":"放弃、丢弃、嫌弃","explanation":"答案不唯一：放弃、丢弃、嫌弃、弃权都可以。"},
],
},
}

for n in [1,2,3,4,5,6,7,8]:
    p = "chinese-g3up/content/u%d.py" % n
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
