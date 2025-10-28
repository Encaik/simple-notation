import { SNParserInputType } from './input';

/** 解析器结果 */
export interface SNParserResult {
  /** 解析器输入 */
  originInput: SNParserInputType;
  /** 乐谱数据 */
  data: SNScoreCollection;
}

export interface SNParserMeta {
  title: string; // 标题（必填）
  subtitle?: string; // 副标题
  contributors: SNMetaContributor[]; // 创作者列表（支持多人多角色）
  copyright?: string; // 版权信息（如 "© 2023 某某音乐"）
}

/** 创作者信息 */
export type SNMetaContributor = {
  name: string; // 姓名
  role: 'composer' | 'lyricist' | 'arranger' | 'transcriber'; // 角色：作曲/作词/编曲/转录
  contact?: string; // 联系方式（可选）
};

export interface SNParserScoreMeta {
  timeSignature?: SNTimeSignature; // 默认拍号（如 4/4）
  keySignature?: SNKeySignature; // 默认调号（如 C大调）
  tempo?: SNTempo; // 默认速度（如 120 BPM）
}

export interface SNTimeSignature {
  numerator: number; // 分子
  denominator: number; // 分母
}

export interface SNKeySignature {
  symbol: 'natural' | 'sharp' | 'flat'; //  accidental symbol
  letter: string; // 键名（如 C）
}

export interface SNTempo {
  value: number; // 速度值
  unit: 'BPM'; // 速度单位
}

export interface SNScoreCollection {
  id: string; // 唯一标识（如 "collection-piano-violin-duet"）
  name: string; // 集合名称（如 "钢琴小提琴二重奏"）
  scores: SNScore[]; // 包含的独立乐谱
}

export interface SNScore {
  id: string; // 唯一标识（如 "score-piano-sonata-c"）
  name: string; // 乐谱名称（如 "C大调钢琴奏鸣曲"）
  meta: SNParserMeta;
  scoreMeta: SNParserScoreMeta;
  sections: SNSection[]; // 章节集合（按演奏顺序）
}

export interface SNSection {
  id: string; // 唯一标识（如 "section-verse-1"）
  name: string; // 章节名称（如 "主歌1"、"Chorus"）
  meta: SNParserMeta;
  scoreMeta: SNParserScoreMeta;
  voices: SNVoice[]; // 章节包含的声部（如钢琴左右手同时存在）
}

export interface SNVoice {
  id: string; // 唯一标识（如 "voice-right-hand"）
  name: string; // 声部名称（如 "右手旋律"、"Bass"）
  instrument?: string; // 乐器类型（如 "piano"、"violin"）
  isPrimary: boolean; // 是否为主声部（渲染优先级）
  voiceMeta: SNVoiceMeta;
  measures: SNMeasure[]; // 该声部包含的小节（按演奏顺序）
}

export interface SNVoiceMeta {
  clef: SNVoiceMetaClef; // 谱号（高音/低音/中音/次中音）
  transpose?: number; // 移调半音数（如 2=升大二度）
  keySignature?: SNKeySignature; // 声部专属调号（覆盖上层，极少用）
}

export type SNVoiceMetaClef = 'treble' | 'bass' | 'alto' | 'tenor';

export interface SNMeasure {
  id: string; // 唯一标识（如 "measure-45"）
  number: number; // 小节号（在声部内连续编号，如 1、2、3）
  elements: SNMeasureElement[]; // 小节内的元素（音符、休止符等）
  measureMeta?: SNMeasureMeta;
  annotations?: SNMeasureAnnotation[];
  chords?: SNChord;
  startBarline?: SNBarline; // 仅在开头有特殊线时使用
  barline: SNBarline; // 始终定义结尾线
}

export interface SNMeasureMeta {
  timeSignature?: SNTimeSignature;
}

export interface SNMeasureAnnotation {
  // 小节注释（如表情记号）
  text: string; // 如 "piano"（弱）、"cresc."（渐强）
  position: 'above' | 'below'; // 显示位置
}

export interface SNChordMarker {
  id: string;
  symbol: string; // 和弦符号（如"C"、"G7"、"Am"）
}

/** 小节内的元素类型（音符、休止符等） */
export type SNMeasureElement = SNNote | SNRest | SNLyricMarker;

/** 音符 */
export interface SNNote {
  type: 'note';
  id: string; // 唯一标识（如 "note-123"）
  pitch: SNPitch; // 音高
  duration: SNDuration; // 时值
  velocity?: number; // 力度（0-127，默认 80）
  articulation?: 'staccato' | 'legato' | 'tenuto'; // 演奏法（跳音、连音等）
  chords?: SNChord;
}

/** 休止符 */
export interface SNRest {
  type: 'rest';
  id: string;
  duration: SNDuration; // 时值（与音符规则一致）
}

/** 和弦（多个音符同时发声） */
export interface SNChord {
  type: 'chord';
  id: string;
  notes: SNNote[]; // 和弦内的音符（共享时值）
  duration: SNDuration;
}

/** 歌词标记（关联音符与歌词） */
export interface SNLyricMarker {
  type: 'lyric-marker';
  id: string;
  noteId: string; // 关联的音符ID
  syllable: string; // 歌词音节（如 "闪"）
}

/** 小节线 */
export interface SNBarline {
  type: 'barline';
  id: string;
  style:
    | 'single'
    | 'double'
    | 'final'
    | 'repeat-start'
    | 'repeat-end'
    | 'repeat-both'; // 样式
}

export interface SNPitch {
  letter: string; // 键名（如 "C"）
  octave: number; // 音阶（如 4）
}

export interface SNDuration {
  value: number; // 时值值（如 1=1拍、2=2拍、4=4拍、8=8拍、16=16拍）
  dots?: number; // 拍点数（如 1=1拍点、2=2拍点、3=3拍点）
}
