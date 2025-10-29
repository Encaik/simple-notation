import { AbcParser } from '../src';

const abcData: string = `% 第一首乐谱：《欢乐颂》- 贝多芬第九交响曲
X:1
T:Ode to Joy
C:Ludwig van Beethoven
S:Symphony No.9, 4th Movement
M:4/4
L:1/8
Q:1/4=120
K:C

S:1
% 第一章节：主旋律
V:1 name="Melody" clef=treble
[K:C] |: (3BBB A2 A2 | G2 G2 (3BBB | A2 A2 G2 G2 | G2 G2 F2 F2 |
E2 E2 D2 D2 | C2 C2 C2 C2 | z8 | z8 :|

V:2 name="Harmony" clef=treble
[K:C] |: C2 C2 G2 G2 | C2 C2 G2 G2 | C2 C2 E2 E2 | C2 C2 E2 E2 |
G2 G2 E2 E2 | G2 G2 E2 E2 | C2 C2 G2 G2 | z8 :|

S:2
% 第二章节：变奏
V:1
|: (3DDD C2 C2 | B2 B2 (3AAA | G2 G2 F2 F2 | E2 E2 D2 D2 |
C2 C2 B2 B2 | A2 A2 G2 G2 | z8 | z8 :|

V:2
|: G2 G2 C2 C2 | G2 G2 C2 C2 | E2 E2 G2 G2 | E2 E2 G2 G2 |
C2 C2 E2 E2 | C2 C2 E2 E2 | G2 G2 C2 C2 | z8 :|

S:3
% 第三章节：高潮部分
V:1
|: C4 D4 | E4 F4 | G8- | G4 F4 |
E4 D4 | C8- | C8 | z8 :|

V:2
|: C4 G4 | C4 G4 | E8- | E4 G4 |
C4 G4 | C8- | C8 | z8 :|

%
% 第二首乐谱：《友谊地久天长》- 苏格兰民歌
X:2
T:Auld Lang Syne
C:Traditional
S:Scottish Folk Song
M:3/4
L:1/8
Q:1/4=90
K:F

% 第一章节：主歌
V:1 name="Soprano" clef=treble
[K:F] |: F2 F2 F2 | A,2 A,2 A,2 | F2 G2 G2 | G2 A,2 A,4 | z6 |
F2 F2 F2 | A,2 A,2 A,2 | G2 F4 | z2 z6 :|

V:2 name="Alto" clef=treble
[K:F] |: C2 C2 C2 | F2 F2 F2 | C2 D2 D2 | D2 F2 F4 | z6 |
C2 C2 C2 | F2 F2 F2 | D2 C4 | z2 z6 :|

V:3 name="Bass" clef=bass
[K:F] |: F,2 F,2 F,2 | C,2 C,2 C,2 | F,2 G,,2 G,,2 | G,,2 C,2 C,4 | z6 |
F,2 F,2 F,2 | C,2 C,2 C,2 | G,,2 F,4 | z2 z6 :|

% 第二章节：副歌
V:1
|: A,2 A,2 A,2 | C2 C2 C2 | A,2 Bb2 Bb2 | Bb2 A,2 A,4 | z6 |
F2 F2 F2 | A,2 A,2 A,2 | G2 F4 | z2 z6 :|

V:2
|: F2 F2 F2 | A2 A2 A2 | F2 G2 G2 | G2 F2 F4 | z6 |
C2 C2 C2 | F2 F2 F2 | D2 C4 | z2 z6 :|

V:3
|: C,2 C,2 C,2 | F,2 F,2 F,2 | C,2 D,2 D,2 | D,2 C,2 C,4 | z6 |
F,2 F,2 F,2 | C,2 C,2 C,2 | G,,2 F,4 | z2 z6 :|

% 第三章节：结尾
V:1
|: F2 F2 F2 | A,2 A,2 A,2 | F2 G2 G2 | G2 A,2 A,4 |
F2 F2 F2 | A,2 A,2 A,2 | G2 F6 | z6 :|

V:2
|: C2 C2 C2 | F2 F2 F2 | C2 D2 D2 | D2 F2 F4 |
C2 C2 C2 | F2 F2 F2 | D2 C6 | z6 :|

V:3
|: F,2 F,2 F,2 | C,2 C,2 C,2 | F,2 G,,2 G,,2 | G,,2 C,2 C,4 |
F,2 F,2 F,2 | C,2 C,2 C,2 | G,,2 F,6 | z6 :|

%
% 第三首乐谱：《小星星》- 儿童歌曲
X:3
T:Twinkle Twinkle Little Star
C:Traditional
M:4/4
L:1/4
Q:1/4=100
K:C

% 第一章节：主旋律
V:1 name="Melody" clef=treble
[K:C] |: C C G G | A A G2 | F F E E | D D C2 |
G G F F | E E D2 | G G F F | E E D2 :|

V:2 name="Accompaniment" clef=treble
[K:C] |: C2 E2 G2 | C2 E2 G2 | F2 A2 C2 | F2 A2 C2 |
E2 G2 B2 | E2 G2 B2 | D2 F2 A2 | D2 F2 A2 :|

% 第二章节：变奏
V:1
|: C4 G4 | A4 G4 | F4 E4 | D4 C4 |
G4 F4 | E4 D4 | G4 F4 | E4 D4 :|

V:2
|: C2 E2 G2 C2 | C2 E2 G2 C2 | F2 A2 C2 F2 | F2 A2 C2 F2 |
E2 G2 B2 E2 | E2 G2 B2 E2 | D2 F2 A2 D2 | D2 F2 A2 D2 :|`;
const res = new AbcParser().parse(abcData);
console.log(res);
