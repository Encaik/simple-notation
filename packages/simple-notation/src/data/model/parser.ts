import {
  SNAnnotation,
  SNBarline,
  SNContributor,
  SNDuration,
  SNKeySignature,
  SNPitch,
  SNScoreProps,
} from '../../core/model/base.ts';

/** 解析器结果 */
export interface SNParserResult {
  /** 乐谱数据 */
  data: SNParserRoot;
}

export interface SNParserNode<T = unknown> {
  id: string;
  type: SNParserNodeType;
  meta?: T;
  parent?: SNParserNode;
  children?: SNParserNode[];
  duration?: SNDuration;
  originStr: string;
  props?: SNScoreProps;
}

export type SNParserNodeType =
  'root' |
  'score' |
  'section' |
  'voice' |
  'measure' |
  'note' |
  'tuplet' |
  'rest' |
  'chord' |
  'lyric' |
  'tie';

export interface SNParserRoot extends SNParserNode {
  type: 'root';
  parent?: undefined;
  children?: SNParserScore[];
}

export interface SNParserMeta {
  title: string; // 标题（必填）
  subtitle?: string; // 副标题
  contributors?: SNContributor[]; // 创作者列表（支持多人多角色）
  copyright?: string; // 版权信息（如 "© 2023 某某音乐"）
  noteLength?: string; // 默认一单位音符时值,如1/4 1/8
}

export interface SNParserScore extends SNParserNode<SNParserMeta> {
  type: 'score';
  children?: SNParserSection[];
}

export interface SNParserSection extends SNParserNode<SNParserMeta> {
  type: 'section';
  children?: SNParserVoice[];
}

export interface SNParserVoice extends SNParserNode<SNVoiceMeta> {
  type: 'voice';
  children?: SNParserMeasure[];
  instrument?: string; // 乐器类型（如 "piano"、"violin"）
  isPrimary?: boolean; // 是否为主声部（渲染优先级）
}

export interface SNParserMeasure extends SNParserNode<SNMeasureMeta> {
  type: 'measure';
  children?: SNParserElement[]; // 小节内的元素（音符、休止符等）
  index: number;
}

/** 小节内的元素类型（音符、休止符等） */
export type SNParserElement =
  SNParserNote
  | SNParserRest
  | SNParserLyric
  | SNParserTuplet
  | SNParserTie;

/** 音符 */
export interface SNParserNote extends SNParserNode {
  type: 'note';
  pitch: SNPitch; // 音高
  articulation?: 'staccato' | 'legato' | 'tenuto'; // 演奏法（跳音、连音等）
  chords?: SNParserChord;
}

/** 连音（含三连音、五连音等，多个个音符共享 n-1 个基本时值） */
export interface SNParserTuplet extends SNParserNode {
  type: 'tuplet';
  count: number; // 连音数量（3=三连音，5=五连音等）
  children?: SNParserNote[]; // 连音内的音符或和弦（需同步发声）
  duration: SNDuration; // 连音整体占用的总时值（如3个八分音符三连音总时值=2个八分音符）
}

/** 休止符 */
export interface SNParserRest extends SNParserNode {
  type: 'rest';
}

/** 延音线 */
export interface SNParserTie extends SNParserNode {
  id: string;
  type: 'tie';
  style: 'slur' | 'tie' | 'phrase'; // 支持不同类型的连音线
}

/** 和弦（多个音符同时发声） */
export interface SNParserChord extends SNParserNode {
  type: 'chord';
  key: string;
  chordType:
    | 'major'       // 大三和弦（根音+大三度+纯五度）
    | 'minor'       // 小三和弦（根音+小三度+纯五度）
    | 'diminished'  // 减三和弦（根音+小三度+减五度）
    | 'augmented'   // 增三和弦（根音+大三度+增五度）
    | '7th'         // 属七和弦（大三和弦+小七度）
    | 'major7th'    // 大七和弦（大三和弦+大七度）
    | 'minor7th'    // 小七和弦（小三和弦+小七度）
    | 'dim7th'      // 减七和弦（减三和弦+减七度）
    | string;       // 扩展类型（如 "9th", "add9", "sus4" 等）
  children: SNParserNote[]; // 和弦内的音符（共享时值）
}

/** 歌词标记（关联音符与歌词） */
export interface SNParserLyric extends SNParserNode {
  type: 'lyric';
  noteId: string; // 关联的音符ID
  syllable: string; // 歌词音节（如 "闪"）
}

export interface SNVoiceMeta {
  clef: SNVoiceMetaClef; // 谱号（高音/低音/中音/次中音）
  transpose?: number; // 移调半音数（如 2=升大二度）
  keySignature?: SNKeySignature; // 声部专属调号（覆盖上层，极少用）
}

export type SNVoiceMetaClef = 'treble' | 'bass' | 'alto' | 'tenor';

export interface SNMeasureMeta {
  annotations?: SNAnnotation[];
  chords?: SNParserChord;
  barline?: SNBarline[];
}
