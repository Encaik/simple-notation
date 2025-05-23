import { SNDataInfo, SNDataType, SNStaveOptions } from '@types';

/**
 * 基础核心类型
 */
export interface SNPoint {
  x: number;
  y: number;
}

export enum SNBoxType {
  ROOT = 'root',
  CONTENT = 'content',
  INFO = 'info',
  SCORE = 'score',
  STAVE = 'stave',
  MEASURE = 'measure',
  NOTE = 'note',
}

export type SNRuntimeOptions = {
  info: SNDataInfo;
  score: string;
  parsedScore: SNStaveOptions[];
  lyric: string;
  splitLyrics: (string | string[])[];
  type: SNDataType;
};
