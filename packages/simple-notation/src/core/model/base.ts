/** 创作者信息 */
export type SNContributor = {
  name: string; // 姓名
  role: 'composer' | 'lyricist' | 'arranger' | 'transcriber'; // 角色：作曲/作词/编曲/转录
  contact?: string; // 联系方式（可选）
};

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

export interface SNAnnotation {
  // 小节注释（如表情记号）
  text: string; // 如 "piano"（弱）、"cresc."（渐强）
  position: 'above' | 'below'; // 显示位置
}

/** 小节线 */
export interface SNBarline {
  type: 'barline';
  id: string;
  style: 'single' | 'double' | 'repeat-start' | 'repeat-end'; // 样式
}

export interface SNPitch {
  letter: string; // 键名（如 "C"）
  octave: number; // 音阶（如 4）
  accidental: SNAccidental;
}

export type SNDuration = number;

export enum SNAccidental {
  NATURAL = 'natural',
  SHARP = 'sharp',
  FLAT = 'flat',
  DOUBLE_SHARP = 'doubleSharp',
  DOUBLE_FLAT = 'doubleFlat',
}

/**
 * 音乐属性（所有层级都可能有的，参与布局渲染）
 * score、section、measure 等层级都可能有这些属性
 */
export interface SNMusicProps {
  timeSignature?: SNTimeSignature; // 拍号（如 4/4）
  keySignature?: SNKeySignature; // 调号（如 C大调）
  tempo?: SNTempo; // 速度（如 120 BPM）
}

/**
 * 元信息属性（只在 score 和 section 层级存在）
 * 参与布局渲染，但不适用于 measure 等更细粒度层级
 */
export interface SNMetadataProps {
  title?: string; // 标题
  subtitle?: string; // 副标题
  contributors?: SNContributor[]; // 创作者列表（作曲、作词等）
}

/**
 * Score 和 Section 的完整属性
 * 包含音乐属性和元信息属性
 */
export type SNScoreProps = SNMusicProps & SNMetadataProps;
