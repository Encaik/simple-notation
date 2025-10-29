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

export interface SNDuration {
  value: number; // 时值值（如 1=1拍、2=2拍、4=4拍、8=8拍、16=16拍）
  dots?: number; // 拍点数（如 1=1拍点、2=2拍点、3=3拍点）
}

export enum SNAccidental {
  NATURAL = 'natural',
  SHARP = 'sharp',
  FLAT = 'flat'
}
