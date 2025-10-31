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

/**
 * 持续时间（以基本时间单位为单位的数值）
 * 例如：如果 baseTimeUnit = 1/32，则：
 *   - 全音符 = 32 个单位
 *   - 四分音符 = 8 个单位
 *   - 八分音符 = 4 个单位
 */
export type SNDuration = number;

export enum SNAccidental {
  NATURAL = 'natural',
  SHARP = 'sharp',
  FLAT = 'flat',
  DOUBLE_SHARP = 'doubleSharp',
  DOUBLE_FLAT = 'doubleFlat',
}

/**
 * 时间单位配置
 * 用于定义基本时间单位，统一不同记谱法的时间对齐计算
 */
export interface SNTimeUnit {
  /**
   * 基本时间单位（相对于全音符的比例）
   * 例如：
   *   - 1/32: 将全音符分为 32 个单位，最小精度为三十二分音符
   *   - 1/64: 将全音符分为 64 个单位，最小精度为六十四分音符
   *   - 1/96: 将全音符分为 96 个单位（支持三连音的精确对齐）
   *
   * 所有音符、休止符、歌词等的 duration 都用这个单位表示
   */
  baseUnit: number; // 例如：1/32, 1/64, 1/96

  /**
   * 每拍的时值（相对于全音符的比例）
   * 由拍号的 denominator 决定，用于将时间单位转换为拍数
   * 例如：
   *   - 4/4 拍：beatUnit = 1/4（一拍是四分音符）
   *   - 3/8 拍：beatUnit = 1/8（一拍是八分音符）
   */
  beatUnit?: number; // 自动根据 timeSignature 计算，也可以手动设置
}

/**
 * 音乐属性（所有层级都可能有的，参与布局渲染）
 * score、section、measure 等层级都可能有这些属性
 */
export interface SNMusicProps {
  timeSignature?: SNTimeSignature; // 拍号（如 4/4）
  keySignature?: SNKeySignature; // 调号（如 C大调）
  tempo?: SNTempo; // 速度（如 120 BPM）
  /**
   * 时间单位配置（通用方案）
   * 用于确定最小时间单位，计算音符、休止符、歌词等在时间序列上的位置对齐
   */
  timeUnit?: SNTimeUnit;
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
