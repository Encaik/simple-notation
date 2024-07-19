export interface SNOptions {
  width?: number;
  height?: number;
  info?: SNInfoOptions;
  content?: SNContentOptions;
  score?: SNScoreOptions;
}

export type SNInfoOptions = {
  height: number;
  padding: number;
};

/* 页面内容模块 */
export interface SNContentOptions {
  padding: number;
  infoShow: boolean;
}

export interface SNScoreOptions {
  padding: number;
  lineHeight: number;
  lineSpace: number;
}

export interface SNStaveOptions {
  index: number;
  currentStave: number;
  y: number;
  height: number;
  context: string;
}

export interface SNMeasureOptions {
  index: number;
  currentMeasure: number;
  x: number;
  width: number;
  context: string;
}

export interface SNNoteOptions {
  index: number;
  currentNote: number;
  x: number;
  width: number;
  context: string;
  startNote: boolean;
  endNote: boolean;
  underlineCount: number;
}

export interface SNBoxOptions {
  inner?: boolean;
  outer?: boolean;
  innerColor?: string;
  innerLineWidth?: number;
  outerColor?: string;
  outerLineWidth?: number;
}
