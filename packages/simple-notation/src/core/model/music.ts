/**
 * 音乐相关的类型定义
 *
 * 包含音符、调号、拍号、速度等音乐元素的基础类型
 */

/**
 * 变音记号枚举
 *
 * 表示音符的升降号信息
 */
export enum SNAccidental {
  /** 自然音（无变音记号） */
  NATURAL = 'natural',
  /** 升号（♯） */
  SHARP = 'sharp',
  /** 降号（♭） */
  FLAT = 'flat',
  /** 重升号（×） */
  DOUBLE_SHARP = 'doubleSharp',
  /** 重降号（♭♭） */
  DOUBLE_FLAT = 'doubleFlat',
}

/**
 * 音高
 *
 * 表示一个音符的音高信息，包括音名、八度和变音记号
 */
export interface SNPitch {
  /** 音名字母（如 "C", "D", "E"） */
  letter: string;
  /** 八度（例如：4 表示中央 C） */
  octave: number;
  /** 变音记号（undefined 表示没有升降号标记，NATURAL 表示明确写了还原号 =） */
  accidental?: SNAccidental;
}

/**
 * 拍号
 *
 * 表示音乐的节拍类型，如 4/4 拍、3/4 拍等
 *
 * @example
 * { numerator: 4, denominator: 4 } // 4/4 拍
 * { numerator: 3, denominator: 4 } // 3/4 拍（华尔兹）
 * { numerator: 6, denominator: 8 } // 6/8 拍
 */
export interface SNTimeSignature {
  /** 每小节的拍数（分子） */
  numerator: number;
  /** 以什么音符为一拍（分母，表示音符时值） */
  denominator: number;
}

/**
 * 调号
 *
 * 表示音乐的调性，如 C大调、G大调等
 *
 * @example
 * { symbol: 'natural', letter: 'C' } // C大调
 * { symbol: 'sharp', letter: 'G' } // G大调（一个升号）
 * { symbol: 'flat', letter: 'F' } // F大调（一个降号）
 */
export interface SNKeySignature {
  /** 变音记号类型（natural=无, sharp=升号, flat=降号） */
  symbol: 'natural' | 'sharp' | 'flat';
  /** 主音字母（如 "C", "G", "F"） */
  letter: string;
}

/**
 * 速度
 *
 * 表示音乐的演奏速度
 *
 * @example
 * { value: 120, unit: 'BPM' } // 120 拍/分钟
 */
export interface SNTempo {
  /** 速度值 */
  value: number;
  /** 速度单位（目前支持 BPM - Beats Per Minute） */
  unit: 'BPM';
}

/**
 * 小节注释
 *
 * 用于标注表情记号、演奏提示等信息
 *
 * @example
 * { text: 'piano', position: 'above' } // 上方标注 "弱"
 * { text: 'cresc.', position: 'below' } // 下方标注 "渐强"
 */
export interface SNAnnotation {
  /** 注释文本（如 "piano"、"cresc."） */
  text: string;
  /** 显示位置（上方或下方） */
  position: 'above' | 'below';
}

/**
 * 小节线
 *
 * 表示小节的边界，可以是普通小节线或重复记号
 */
export interface SNBarline {
  /** 类型标识 */
  type: 'barline';
  /** 唯一标识符 */
  id: string;
  /** 小节线样式 */
  style: 'single' | 'double' | 'repeat-start' | 'repeat-end';
}
