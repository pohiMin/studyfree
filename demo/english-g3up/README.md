# 英语学习台 · 译林版 3A（三年级起点）

与 `demo/math-g3up` 同一套架构的英语版：纯静态、数据即代码、构建即校验。

## 快速开始

双击 `首页.html`（demo 目录）选英语，或双击 `启动学习台.bat` 起本地服务后访问
`http://127.0.0.1:8899/index.html`。改动 `content/uX.py` 后重新运行 `build.py` 即可。

## 内容

| 单元 | Big question / 核心句型 | 字母 |
|---|---|---|
| 1 Hello! | How do you greet people? — Hello/Hi/Good morning；I'm… | Aa—Dd |
| 2 What's your name? | 问名字与回答；Welcome；Let's play | Ee—Gg |
| 3 Are you Su Hai? | Are you…? — Yes, I am. / No, I'm not.；he/she | Hh—Kk |
| 4 This is my friend | This is…；Nice to meet you（, too.） | Ll—Nn |
| 5 She's my mother | Who's she/he? — She's/He's my…（家庭词汇） | O 起滚动 |
| 6 Is he your grandpa? | Is he/she…? — Yes, he is. / No, he isn't.（家谱三层） | Oo—Qq |
| 7 Happy Birthday! | 祝福与道谢；How old are you? — I'm nine.（数字 1—10） | R—W |
| 8 I can do this for you | I can…（for you）；Can you…? — Yes, I can. / No, I can't. | R—Z 收官 |

另有：期中阶段检测（Module 1，34 题 100 分）、期末检测卷（全册，32 题 100 分）、
**背单词**（words.html，70 词）。

合计 8 单元 528 题 + 期中 34 题 + 期末 32 题 + 词汇 70 个。

## 背单词（words.html）

- 侧栏按单元分组（另设「全部复习」），每组显示掌握进度 x/y
- **看卡片**：点卡片翻面（英文 → 中文 + 例句），已掌握的显示绿色对勾
- **考一考**：一词一关，同一词连续答对 3 次（英中方向轮换）标记掌握；
  答错连对清零并换词；全部掌握后显示鼓励页
- 记忆状态存 `english3.words.v1`，跨页面、跨次打开保留
- **词汇来源必须知道**：这 70 词是从**已核课文句型**中提取的（每个词都能对应到一条已核
  句型，如 mother ← She's my mother.），**不是课本官方词汇表**——词表页尚未核对
  （见底本第七节待确认项）。拿到课本词表后应逐词校正增删。

## 判分容差（重要）

英文填空判分做了三重容差，孩子不容易被「格式」冤枉：

1. 大小写不敏感（name = NAME）
2. 撇号可省（I'm = im）
3. 结尾标点可省（Thank you! = thank you）

已用自动化测试验证：三种写法全判对，错误拼写仍判错（`test_norm.mjs`）。

## 与其他科的差别

- 没有教学视频区：未找到可逐课对应的可验证合集，不放未验证链接。
- 听说类练习（跟读、听力）暂缺：需要课本音频素材，待确认教材音频载体后补。
- Unit 5—8 的课本板块名与字母官方切分「待核」（见底本第七节），因此不设 U5—U8 的字母切分题，
  字母滚动题只依据客观的字母表顺序（Oo—Zz 综合认读），不编造官方分配。

## 事实核对记录

- Module 1 的 Big question、板块名、字母分配按底本已核内容出题。
- U5—U8 的核心句型（Who's she / Is he your grandpa / How old are you / I can…）来自底本第五节已核表格。
- 语法要点已按底本强调：Yes, I am. 不能缩写、No, I'm not.（无 amn't）、can + 动词原形。

## 校验

`build.py` 构建时自动校验：题型、答案越界、缺解析、卷面分值合计。
uitest.py 自动答题回归九页全过；test_norm.mjs 验证英文判分容差；
test_words.mjs 端到端验证背单词（12 项：翻卡、一词一关连对 3 次掌握、答错清零、持久化、侧栏进度）。

---

*本 README 对应 2026-10-26 的内容版本。*
