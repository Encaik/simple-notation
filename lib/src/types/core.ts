/**
 * 基础核心类型
 */
export interface SNPoint {
  x: number;
  y: number;
}

export enum SNBoxType {
  CONTENT,
  INFO,
  SCORE,
  STAVE,
  MEASURE,
  NOTE,
}
