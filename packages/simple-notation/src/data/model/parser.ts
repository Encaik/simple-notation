import {
  SNAnnotation,
  SNBarline,
  SNContributor,
  SNKeySignature,
} from '../../core/model/base.ts';
import {
  SNParserChord,
  SNParserLyric,
  SNParserNote,
  SNParserRest,
  SNParserRoot,
  SNParserTie,
  SNParserTuplet,
} from '../impl';

/** 解析器结果 */
export interface SNParserResult {
  /** 乐谱数据 */
  data: SNParserRoot;
}

export type SNParserNodeType =
  | 'root'
  | 'score'
  | 'section'
  | 'voice'
  | 'measure'
  | 'note'
  | 'tuplet'
  | 'rest'
  | 'chord'
  | 'lyric'
  | 'tie';

/** 小节内的元素类型（音符、休止符等） */
export type SNParserElement =
  | SNParserNote
  | SNParserRest
  | SNParserLyric
  | SNParserTuplet
  | SNParserTie;

export type SNChordType =
  | 'major' // 大三和弦（根音+大三度+纯五度）
  | 'minor' // 小三和弦（根音+小三度+纯五度）
  | 'diminished' // 减三和弦（根音+小三度+减五度）
  | 'augmented' // 增三和弦（根音+大三度+增五度）
  | '7th' // 属七和弦（大三和弦+小七度）
  | 'major7th' // 大七和弦（大三和弦+大七度）
  | 'minor7th' // 小七和弦（小三和弦+小七度）
  | 'dim7th' // 减七和弦（减三和弦+减七度）
  | string; // 扩展类型（如 "9th", "add9", "sus4" 等）

export interface SNParserMeta {
  title: string; // 标题（必填）
  subtitle?: string; // 副标题
  contributors?: SNContributor[]; // 创作者列表（支持多人多角色）
  copyright?: string; // 版权信息（如 "© 2023 某某音乐"）
  noteLength?: string; // 默认一单位音符时值,如1/4 1/8
  [key: string]: unknown;
}

export interface SNVoiceMeta {
  clef: SNVoiceMetaClef; // 谱号（高音/低音/中音/次中音）
  transpose?: number; // 移调半音数（如 2=升大二度）
  keySignature?: SNKeySignature; // 声部专属调号（覆盖上层，极少用）
  [key: string]: unknown;
}

export type SNVoiceMetaClef = 'treble' | 'bass' | 'alto' | 'tenor';

export interface SNMeasureMeta {
  annotations?: SNAnnotation[];
  chords?: SNParserChord[];
  barline?: SNBarline[];
  [key: string]: unknown;
}
