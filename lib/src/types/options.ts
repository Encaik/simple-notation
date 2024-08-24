/**
 * class初始化时需要的配置项
 */
export interface SNOptions {
  width?: number;
  height?: number;
  content?: SNContentOptions;
  info?: SNInfoOptions;
  score?: SNScoreOptions;
  debug?: boolean;
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
  lineWeight: number; // 每行歌词权重
  allowOverWeight: number; // 每行歌词允许的溢出权重
}

export interface SNStaveOptions {
  index: number; // 当前是第几个乐句
  weight: number; // 乐句总权重
  measureOptions: SNMeasureOptions[]; // 当前乐句每个小节的内容
  y: number; // 当前乐句的y轴坐标
}

export interface SNMeasureOptions {
  index: number; // 当前是第几个小节
  measureData: string; // 当前小节的原始数据
  weight: number;
  noteOptions: SNNoteOptions[];
  x: number; // 当前小节的x轴坐标
  width: number; // 当前小节的宽度
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
}

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
