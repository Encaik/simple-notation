import { AbcParser } from '../src';
import { SNLayoutBuilder } from '../src/layout/builder';

/**
 * 全面的 ABC 测试用例
 * 覆盖 ABC 标准 v2.1 的主要功能：
 * - 文件头元数据（%% 指令）
 * - 多个 tune（X:1, X:2, X:3）
 * - 完整的元数据字段
 * - 多声部（V:1, V:2, V:3）
 * - 多个章节（S:1, S:2, S:3）
 * - 歌词（w: 和 W:，包含各种对齐符号）
 * - 各种音符类型（普通音符、连音、休止符）
 * - 变音记号（^升号, _降号）
 * - 延音线（-）
 * - 小节线和重复记号（|, :|:, |:）
 * - 元数据行（[K:C], [M:4/4] 等）
 * - 注释（%）
 */
const abcData: string = `%%abc-2.1
%%encoding utf-8
%%abc-charset utf-8
%%这是一个全面的 ABC 测试文件
% 用于测试解析器的各种功能

X:1
T:欢乐颂
T:Ode to Joy
C:Ludwig van Beethoven
O:Germany
A:Vienna
N:贝多芬第九交响曲第四乐章主题
M:4/4
L:1/8
Q:1/4=120
K:C major

S:1
% 第一章节：主旋律（包含歌词）
V:1 name="Melody" clef=treble
[K:C] |: (3BBB A2 A2 | G2 G2 (3BBB | A2 A2 G2 G2 | G2 G2 F2 F2 |
w:欢 乐 颂 | 歌 声 嘹 亮 | 传 遍 四 方 | 和 平 友 爱 |
E2 E2 D2 D2 | C2 C2 C2 C2 | z8 | z8 :|
w:永 远 不 变 | 人 类 希 望 | * * | * * |

V:2 name="Harmony" clef=treble
[K:C] |: C2 C2 G2 G2 | C2 C2 G2 G2 | C2 C2 E2 E2 | C2 C2 E2 E2 |
G2 G2 E2 E2 | G2 G2 E2 E2 | C2 C2 G2 G2 | z8 :|

S:2
% 第二章节：变奏（包含多音节和延长音）
V:1 name="Melody" clef=treble
[K:C] |: (3DDD C2 C2 | B2 B2 (3AAA | G2 G2 F2 F2 | E2 E2 D2 D2 |
w:变-奏 旋 律 | 优 美 动 听 | 音-符 跳 跃 | 节 奏 鲜 明 |
C2 C2 B2 B2 | A2 A2 G2 G2 | z8 | z8 :|
w:和 声 丰 富 | 层 次 分 明 | * * | * * |

V:2 name="Harmony" clef=treble
[K:C] |: G2 G2 C2 C2 | G2 G2 C2 C2 | E2 E2 G2 G2 | E2 E2 G2 G2 |
C2 C2 E2 E2 | C2 C2 E2 E2 | G2 G2 C2 C2 | z8 :|

S:3
% 第三章节：高潮部分（包含延音线和变音记号）
V:1 name="Melody" clef=treble
[K:C] |: C4 D4 | E4 F4 | G8- | G4 F4 |
w:高 潮 来 临 | 情 绪 高 涨 | 延 长_ | 音 符 持 续 |
E4 D4 | C8- | C8 | z8 :|
w:逐 渐 回 落 | 宁 静_ | 安 详 | 结 束 |

V:2 name="Harmony" clef=treble
[K:C] |: C4 G4 | C4 G4 | E8- | E4 G4 |
C4 G4 | C8- | C8 | z8 :|

X:2
T:友谊地久天长
T:Auld Lang Syne
C:Traditional
O:Scotland
A:Scotland
N:苏格兰传统民歌
M:3/4
L:1/8
Q:1/4=90
K:F major

% 第一章节：主歌（多声部合唱）
S:1
V:1 name="Soprano" clef=treble
[K:F] |: F2 F2 F2 | A,2 A,2 A,2 | F2 G2 G2 | G2 A,2 A,4 | z6 |
w:友 谊 地 久 | 天 长 我 们 | 共 同 歌 唱 | 美 好 时 光 | * * |
F2 F2 F2 | A,2 A,2 A,2 | G2 F4 | z2 z6 :|
w:回 忆 过 去 | 珍 惜 现 在 | 友 谊 永 存 | * * * |

V:2 name="Alto" clef=treble
[K:F] |: C2 C2 C2 | F2 F2 F2 | C2 D2 D2 | D2 F2 F4 | z6 |
C2 C2 C2 | F2 F2 F2 | D2 C4 | z2 z6 :|

V:3 name="Bass" clef=bass
[K:F] |: F,2 F,2 F,2 | C,2 C,2 C,2 | F,2 G,,2 G,,2 | G,,2 C,2 C,4 | z6 |
F,2 F,2 F,2 | C,2 C,2 C,2 | G,,2 F,4 | z2 z6 :|

% 第二章节：副歌（包含变音记号）
S:2
V:1 name="Soprano" clef=treble
[K:F] |: A,2 A,2 A,2 | C2 C2 C2 | A,2 ^B2 ^B2 | ^B2 A,2 A,4 | z6 |
w:副 歌 旋 律 | 更 加 优 美 | 升 音 增 加 | 色 彩 丰 富 | * * |
F2 F2 F2 | A,2 A,2 A,2 | G2 F4 | z2 z6 :|
w:回 到 主 题 | 深 情 演 绎 | 完 美 结 束 | * * * |

V:2 name="Alto" clef=treble
[K:F] |: F2 F2 F2 | A2 A2 A2 | F2 G2 G2 | G2 F2 F4 | z6 |
C2 C2 C2 | F2 F2 F2 | D2 C4 | z2 z6 :|

V:3 name="Bass" clef=bass
[K:F] |: C,2 C,2 C,2 | F,2 F,2 F,2 | C,2 D,2 D,2 | D,2 C,2 C,4 | z6 |
F,2 F,2 F,2 | C,2 C,2 C,2 | G,,2 F,4 | z2 z6 :|

% 第三章节：结尾
S:3
V:1 name="Soprano" clef=treble
[K:F] |: F2 F2 F2 | A,2 A,2 A,2 | F2 G2 G2 | G2 A,2 A,4 |
F2 F2 F2 | A,2 A,2 A,2 | G2 F6 | z6 :|

V:2 name="Alto" clef=treble
[K:F] |: C2 C2 C2 | F2 F2 F2 | C2 D2 D2 | D2 F2 F4 |
C2 C2 C2 | F2 F2 F2 | D2 C6 | z6 :|

V:3 name="Bass" clef=bass
[K:F] |: F,2 F,2 F,2 | C,2 C,2 C,2 | F,2 G,,2 G,,2 | G,,2 C,2 C,4 |
F,2 F,2 F,2 | C,2 C,2 C,2 | G,,2 F,6 | z6 :|

X:3
T:小星星
T:Twinkle Twinkle Little Star
C:Traditional
M:4/4
L:1/4
Q:1/4=100
K:C major

% 第一章节：主旋律（包含多行歌词）
S:1
V:1 name="Melody" clef=treble
[K:C] |: C C G G | A A G2 | F F E E | D D C2 |
w:一 闪 一 闪 | 亮 晶 晶 | 满 天 都 是 | 小 星 星 |
W:Twinkle twinkle | little star | how I wonder | what you are |
G G F F | E E D2 | G G F F | E E D2 :|
w:挂 在 天 空 | 放 光 明 | 好 像 许 多 | 小 眼 睛 |
W:Up above the | world so high | like a diamond | in the sky |

V:2 name="Accompaniment" clef=treble
[K:C] |: C2 E2 G2 | C2 E2 G2 | F2 A2 C2 | F2 A2 C2 |
E2 G2 B2 | E2 G2 B2 | D2 F2 A2 | D2 F2 A2 :|

% 第二章节：变奏（包含多词同音符和对齐）
S:2
V:1 name="Melody" clef=treble
[K:C] |: C4 G4 | A4 G4 | F4 E4 | D4 C4 |
w:快~乐~的 | 小~朋~友 | 唱~着~歌 | 跳~着~舞 |
G4 F4 | E4 D4 | G4 F4 | E4 D4 :|
w:星~星~们 | 眨~眼~睛 | 陪~伴~着 | 我~们~玩 |

V:2 name="Accompaniment" clef=treble
[K:C] |: C2 E2 G2 C2 | C2 E2 G2 C2 | F2 A2 C2 F2 | F2 A2 C2 F2 |
E2 G2 B2 E2 | E2 G2 B2 E2 | D2 F2 A2 D2 | D2 F2 A2 D2 :|

X:4
T:测试用例：复杂功能
C:Test Suite
M:6/8
L:1/16
Q:3/8=80
K:G major

% 测试章节：各种复杂功能
S:1
V:1 name="Complex" clef=treble
% 测试：连音、变音、延音线、休止符混合
[K:G] |: (3^F^G^A ^G4 ^F4 | (5G A B c d) ^G4 |
w:三 连 音 | 五 连 音 |
_E4 =F4 G4 | A4- A4 z4 | B4 _c4 d4 | z8 :|
w:降 音 还 原 | 延 长_ * | 升 降 混 合 | * * |

V:2 name="Harmony" clef=treble
[K:G] |: G4 D4 | E4 D4 | G4 E4 | D4 G4 | E4 D4 | z8 :|`;
const data = new AbcParser().parse(abcData);
const res = new SNLayoutBuilder(data).getLayoutTree();
console.log(data);
