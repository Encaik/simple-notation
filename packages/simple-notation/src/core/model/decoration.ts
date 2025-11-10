/**
 * 装饰符（Decoration/Ornament）类型定义
 *
 * 根据 ABC 标准 v2.1/v2.2
 * @see https://abcnotation.com/wiki/abc:standard:v2.1#decorations
 */

/**
 * 装饰符类型
 *
 * ABC 支持两种表示方式：
 * 1. 符号形式：. ~ H L M O P S T u v 等
 * 2. 长格式：!trill!, !fermata!, !marcato! 等
 */
export enum SNDecorationType {
  // 基本装饰符
  STACCATO = 'staccato', // . 断奏
  TENUTO = 'tenuto', // - 保持音
  ACCENT = 'accent', // > < 重音
  MARCATO = 'marcato', // ^ 强音

  // 颤音和回音
  TRILL = 'trill', // T !trill! 颤音
  MORDENT = 'mordent', // M !mordent! 波音
  LOWER_MORDENT = 'lower-mordent', // !lowermordent! 下波音
  UPPER_MORDENT = 'upper-mordent', // !uppermordent! 上波音
  PRALLTRILLER = 'pralltriller', // P !pralltriller! 回音
  TURN = 'turn', // !turn! 回音

  // 滑音和装饰音
  SLIDE = 'slide', // !slide! 滑音
  ROLL = 'roll', // R !roll! 滚奏

  // 延音和休止
  FERMATA = 'fermata', // H !fermata! 延音
  FERMATA_BELOW = 'fermata-below', // !fermata-below! 下延音
  FERMATA_ABOVE = 'fermata-above', // !fermata-above! 上延音
  BREATH = 'breath', // !breath! 换气记号

  // 琶音和和弦装饰
  ARPEGGIO = 'arpeggio', // !arpeggio! 琶音

  // 弓法（弦乐器）
  UPBOW = 'upbow', // u !upbow! 上弓
  DOWNBOW = 'downbow', // v !downbow! 下弓

  // 力度记号
  CRESCENDO = 'crescendo', // !crescendo(! 渐强开始
  CRESCENDO_END = 'crescendo-end', // !crescendo)! 渐强结束
  DIMINUENDO = 'diminuendo', // !diminuendo(! 渐弱开始
  DIMINUENDO_END = 'diminuendo-end', // !diminuendo)! 渐弱结束

  // 踏板记号（钢琴）
  PEDAL_DOWN = 'pedal-down', // !ped! 踏板按下
  PEDAL_UP = 'pedal-up', // !ped-up! 踏板抬起

  // 特殊记号
  SEGNO = 'segno', // !segno! 反复记号
  CODA = 'coda', // !coda! 尾声记号
  D_C = 'd.c.', // !D.C.! 从头反复
  D_S = 'd.s.', // !D.S.! 从记号反复
  FINE = 'fine', // !fine! 终止

  // 编辑性记号
  EDITORIAL = 'editorial', // !editorial! 编辑性记号
  COURTESY = 'courtesy', // !courtesy! 提示性记号

  // 其他
  PLUS = 'plus', // + !plus! 加号
  EMPHASIS = 'emphasis', // !emphasis! 强调
  FINGERING = 'fingering', // 指法记号

  // 自定义
  CUSTOM = 'custom', // 自定义装饰符
}

/**
 * 装饰符对象
 */
export interface SNDecoration {
  /** 装饰符类型 */
  type: SNDecorationType;
  /** 原始文本（如 "!trill!", "T", "." 等） */
  text: string;
  /** 位置（above 或 below，某些装饰符支持） */
  position?: 'above' | 'below';
  /** 参数（如指法数字、自定义内容） */
  parameter?: string;
}

/**
 * 装饰符符号到类型的映射
 *
 * 根据 ABC 标准定义
 */
export const DECORATION_SYMBOL_MAP: Record<string, SNDecorationType> = {
  // 基本符号形式
  '.': SNDecorationType.STACCATO,
  '~': SNDecorationType.ROLL,
  H: SNDecorationType.FERMATA,
  L: SNDecorationType.ACCENT,
  M: SNDecorationType.MORDENT,
  O: SNDecorationType.CODA,
  P: SNDecorationType.PRALLTRILLER,
  S: SNDecorationType.SEGNO,
  T: SNDecorationType.TRILL,
  u: SNDecorationType.UPBOW,
  v: SNDecorationType.DOWNBOW,
};

/**
 * 装饰符长格式到类型的映射
 *
 * 支持 !decoration! 格式
 */
export const DECORATION_LONG_MAP: Record<string, SNDecorationType> = {
  // 颤音和回音
  trill: SNDecorationType.TRILL,
  mordent: SNDecorationType.MORDENT,
  lowermordent: SNDecorationType.LOWER_MORDENT,
  uppermordent: SNDecorationType.UPPER_MORDENT,
  pralltriller: SNDecorationType.PRALLTRILLER,
  turn: SNDecorationType.TURN,

  // 滑音和装饰音
  slide: SNDecorationType.SLIDE,
  roll: SNDecorationType.ROLL,

  // 延音
  fermata: SNDecorationType.FERMATA,
  'fermata-above': SNDecorationType.FERMATA_ABOVE,
  'fermata-below': SNDecorationType.FERMATA_BELOW,
  breath: SNDecorationType.BREATH,

  // 琶音
  arpeggio: SNDecorationType.ARPEGGIO,

  // 弓法
  upbow: SNDecorationType.UPBOW,
  downbow: SNDecorationType.DOWNBOW,

  // 力度
  'crescendo(': SNDecorationType.CRESCENDO,
  'crescendo)': SNDecorationType.CRESCENDO_END,
  'diminuendo(': SNDecorationType.DIMINUENDO,
  'diminuendo)': SNDecorationType.DIMINUENDO_END,
  '<(': SNDecorationType.CRESCENDO,
  '<)': SNDecorationType.CRESCENDO_END,
  '>(': SNDecorationType.DIMINUENDO,
  '>)': SNDecorationType.DIMINUENDO_END,

  // 踏板
  ped: SNDecorationType.PEDAL_DOWN,
  'ped-up': SNDecorationType.PEDAL_UP,

  // 特殊记号
  segno: SNDecorationType.SEGNO,
  coda: SNDecorationType.CODA,
  'D.C.': SNDecorationType.D_C,
  'D.S.': SNDecorationType.D_S,
  fine: SNDecorationType.FINE,

  // 编辑性记号
  editorial: SNDecorationType.EDITORIAL,
  courtesy: SNDecorationType.COURTESY,

  // 基本装饰
  staccato: SNDecorationType.STACCATO,
  tenuto: SNDecorationType.TENUTO,
  accent: SNDecorationType.ACCENT,
  marcato: SNDecorationType.MARCATO,
  emphasis: SNDecorationType.EMPHASIS,

  // 其他
  '+': SNDecorationType.PLUS,
  plus: SNDecorationType.PLUS,
};
