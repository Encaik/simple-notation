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
  style:
    | 'single'
    | 'double'
    | 'repeat-start'
    | 'repeat-end'; // 样式
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

export interface SNScoreProps {
  timeSignature?: SNTimeSignature; // 默认拍号（如 4/4）
  keySignature?: SNKeySignature; // 默认调号（如 C大调）
  tempo?: SNTempo; // 默认速度（如 120 BPM）
}
