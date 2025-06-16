/**
 * 简谱渲染器初始化配置项。
 * @property {number} [width] - 渲染区域宽度。
 * @property {number} [height] - 渲染区域高度。
 * @property {SNContentOptions} [content] - 内容区域配置。
 * @property {SNInfoOptions} [info] - 信息区域配置。
 * @property {Partial<SNScoreOptions>} [score] - 总谱区域配置。
 * @property {boolean} [debug] - 是否开启调试模式。
 * @property {boolean} [resize] - 是否自动监听容器尺寸变化并自适应。
 */
export interface SNOptions {
  width?: number;
  height?: number;
  content?: SNContentOptions;
  info?: SNInfoOptions;
  score?: Partial<SNScoreOptions>;
  debug?: boolean;
  resize?: boolean;
}

/**
 * 信息区域配置。
 * @property {number} height - 区域高度。
 * @property {number | number[]} padding - 区域内边距。
 */
export type SNInfoOptions = {
  height: number;
  padding: number | number[];
};

/**
 * 内容区域配置。
 * @property {number | number[]} padding - 区域内边距。
 * @property {boolean} infoShow - 是否显示信息区域。
 */
export interface SNContentOptions {
  padding: number | number[];
  infoShow: boolean;
}

/**
 * 总谱区域配置。
 * @property {number | number[]} padding - 区域内边距。
 * @property {number} lineHeight - 每行高度。
 * @property {number} lineSpace - 每行间距。
 * @property {number} lyricHeight - 歌词行高。
 * @property {number} chordHeight - 和弦/强弱符号高度。
 * @property {number} lineWeight - 每行歌词权重。
 * @property {number} allowOverWeight - 每行歌词允许的溢出权重。
 * @property {SNChordType} chordType - 和弦显示类型。
 * @property {SNScoreType} scoreType - 总谱显示类型。
 * @property {boolean} showChordLine - 是否显示和弦线。
 * @property {number} chordLineHeight - 和弦线高度。
 */
export interface SNScoreOptions {
  padding: number | number[];
  lineHeight: number;
  lineSpace: number;
  lyricHeight: number;
  chordHeight: number;
  lineWeight: number;
  allowOverWeight: number;
  chordType: SNChordType;
  scoreType: SNScoreType;
  showChordLine: boolean;
  chordLineHeight: number;
}

export enum SNChordType {
  Default = 'default',
  Guitar = 'guitar',
}

export enum SNScoreType {
  Simple = 'simple',
  Guitar = 'guitar',
  SimpleGuirar = 'simple-guitar',
}

/**
 * 乐句配置。
 * @property {number} index - 当前是第几个乐句。
 * @property {number} weight - 乐句总权重。
 * @property {SNMeasureOptions[]} measureOptions - 当前乐句每个小节的内容。
 * @property {number} y - 当前乐句的y轴坐标。
 * @property {boolean} endLine - 当前乐句是否是最后一行。
 */
export interface SNStaveOptions {
  index: number;
  weight: number;
  measureOptions: SNMeasureOptions[];
  type: SNStaveType;
  y: number;
  endLine: boolean;
}

export enum SNStaveType {
  DefaultLine = 'default-line',
  ChordLine = 'chord-line',
}

/**
 * 小节配置。
 * @property {number} index - 当前是第几个小节。
 * @property {string} measureData - 当前小节的原始数据。
 * @property {number} weight - 小节权重。
 * @property {SNNoteOptions[]} noteOptions - 小节内音符配置。
 * @property {number} x - 小节x轴坐标。
 * @property {number} width - 小节宽度。
 * @property {boolean} [repeatStart] - 是否为循环开始小节。
 * @property {boolean} [repeatEnd] - 是否为循环结束小节。
 */
export interface SNMeasureOptions {
  index: number;
  measureData: string;
  weight: number;
  noteOptions: SNNoteOptions[];
  x: number;
  width: number;
  repeatStart?: boolean;
  repeatEnd?: boolean;
}

/**
 * 音符配置。
 * @property {number} index - 当前是第几个音符。
 * @property {string} noteData - 当前音符的原始数据。
 * @property {number} weight - 当前音符的权重。
 * @property {string} note - 当前音符。
 * @property {boolean} startNote - 是否是起始音符。
 * @property {boolean} endNote - 是否是终止音符。
 * @property {number} underlineCount - 下划线数量。
 * @property {number} x - x轴坐标。
 * @property {number} width - 宽度。
 * @property {number} upDownCount - 升降数量。
 * @property {number} octaveCount - 八度数量。
 * @property {boolean} isTieStart - 是否是连音起始音符。
 * @property {boolean} isTieEnd - 是否是连音终止音符。
 * @property {SNGraceNoteOptions[]} graceNotes - 装饰音。
 * @property {boolean} isError - 是否为时值错误音符。
 * @property {string} [chord] - 和弦标记。
 * @property {number} duration - 音符时值。
 * @property {number} nodeTime - 音符占用拍数。
 * @property {number} startPosition - 音符起始位置。
 * @property {number} endPosition - 音符结束位置。
 * @property {boolean} [isTriplet] - 是否为三连音音符。
 * @property {boolean} [tripletGroupStart] - 是否为三连音组首音。
 * @property {boolean} [tripletGroupEnd] - 是否为三连音组末音。
 * @property {boolean} [hasLeftBracket] - 是否有左括号。
 * @property {boolean} [hasRightBracket] - 是否有右括号。
 */
export interface SNNoteOptions {
  index?: number;
  noteData: string;
  weight: number;
  note: string;
  startNote?: boolean;
  endNote?: boolean;
  underlineCount: number;
  x?: number;
  width?: number;
  upDownCount: number;
  octaveCount: number;
  isTieStart: boolean;
  isTieEnd: boolean;
  graceNotes: SNGraceNoteOptions[];
  multiNotes: SNMultiNoteOptions[];
  isError?: boolean;
  chord?: string[];
  duration: number;
  isDelay: boolean;
  nodeTime: number;
  startPosition?: number;
  endPosition?: number;
  isTriplet?: boolean;
  tripletGroupStart?: boolean;
  tripletGroupEnd?: boolean;
  hasLeftBracket?: boolean;
  hasRightBracket?: boolean;
}

/**
 * 装饰音配置，继承自SNNoteOptions，去除部分字段。
 */
export type SNGraceNoteOptions = Pick<
  SNNoteOptions,
  | 'note'
  | 'upDownCount'
  | 'octaveCount'
  | 'underlineCount'
  | 'duration'
  | 'nodeTime'
>;

export type SNMultiNoteOptions = Pick<
  SNNoteOptions,
  'note' | 'upDownCount' | 'octaveCount'
>;

/**
 * 边框盒子调试配置。
 * @property {boolean} [inner] - 是否显示内边框。
 * @property {boolean} [outer] - 是否显示外边框。
 * @property {string} [innerColor] - 内边框颜色。
 * @property {number} [innerLineWidth] - 内边框线宽。
 * @property {string} [outerColor] - 外边框颜色。
 * @property {number} [outerLineWidth] - 外边框线宽。
 */
export interface SNBorderBoxOptions {
  inner?: boolean;
  outer?: boolean;
  innerColor?: string;
  innerLineWidth?: number;
  outerColor?: string;
  outerLineWidth?: number;
}

/**
 * 调试模式下的边框盒子配置。
 * @property {object} [borderbox] - 各区域边框盒子配置。
 */
export interface SNDebugOptions {
  borderbox?: {
    content?: SNBorderBoxOptions;
    info?: SNBorderBoxOptions;
    score?: SNBorderBoxOptions;
    stave?: SNBorderBoxOptions;
    measure?: SNBorderBoxOptions;
    note?: SNBorderBoxOptions;
  };
}
