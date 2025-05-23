/**
 * class初始化时需要的配置项
 */
export interface SNOptions {
  width?: number;
  height?: number;
  content?: SNContentOptions;
  info?: SNInfoOptions;
  score?: Partial<SNScoreOptions>;
  debug?: boolean;
  /**
   * 是否自动监听容器尺寸变化并自适应
   */
  resize?: boolean;
}

export type SNInfoOptions = {
  height: number;
  padding: number;
};

export interface SNContentOptions {
  padding: number;
  infoShow: boolean;
}

export interface SNScoreOptions {
  padding: number; // 内边距
  lineHeight: number; // 每行高度
  lineSpace: number; // 每行间距
  lyricHeight: number; // 歌词行高
  chordHeight: number; // 和弦/强弱符号高度，默认 0
  lineWeight: number; // 每行歌词权重
  allowOverWeight: number; // 每行歌词允许的溢出权重
}

export interface SNStaveOptions {
  index: number; // 当前是第几个乐句
  weight: number; // 乐句总权重
  measureOptions: SNMeasureOptions[]; // 当前乐句每个小节的内容
  y: number; // 当前乐句的y轴坐标
  endLine: boolean; // 当前乐句是否是最后一行
}

export interface SNMeasureOptions {
  index: number; // 当前是第几个小节
  measureData: string; // 当前小节的原始数据
  weight: number;
  noteOptions: SNNoteOptions[];
  x: number; // 当前小节的x轴坐标
  width: number; // 当前小节的宽度
  /** 是否为循环开始小节 */
  repeatStart?: boolean;
  /** 是否为循环结束小节 */
  repeatEnd?: boolean;
}

export interface SNNoteOptions {
  index: number; // 当前是第几个音符
  noteData: string; // 当前音符的原始数据
  weight: number; // 当前音符的权重
  note: string; // 当前音符
  startNote: boolean; // 当前音符是否是起始音符
  endNote: boolean; // 当前音符是否是终止音符
  underlineCount: number; // 当前音符的下划线数量
  x: number; // 当前音符的x轴坐标
  width: number; // 当前音符的宽度
  upDownCount: number; // 当前音符的升降数量
  octaveCount: number; // 当前音符的八度数量
  isTieStart: boolean; // 当前音符是否是连音的起始音符
  isTieEnd: boolean; // 当前音符是否是连音的终止音符
  graceNotes: SNGraceNoteOptions[]; // 当前音符的装饰音
  /**
   * 是否为时值错误音符（超出小节拍数时为true）
   */
  isError: boolean;
  /**
   * 该音符上方的和弦标记（如有）
   */
  chord?: string;
  /**
   * 音符的时值，4=四分音符，8=八分音符，2=二分音符，16=十六分音符等
   * @type {number}
   */
  duration: number;
}

export type SNGraceNoteOptions = Omit<
  SNNoteOptions,
  | 'index'
  | 'noteData'
  | 'weight'
  | 'startNote'
  | 'endNote'
  | 'x'
  | 'width'
  | 'isTieStart'
  | 'isTieEnd'
  | 'graceNotes'
>;

export type SNNoteParserOptions = Omit<
  SNNoteOptions,
  'index' | 'noteData' | 'startNote' | 'endNote' | 'x' | 'width'
> & {
  nodeTime: number;
  graceNotes: SNGraceNoteOptions[];
};

export interface SNBorderBoxOptions {
  inner?: boolean;
  outer?: boolean;
  innerColor?: string;
  innerLineWidth?: number;
  outerColor?: string;
  outerLineWidth?: number;
}

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
