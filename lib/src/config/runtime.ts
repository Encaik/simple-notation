import { SNData, SNDataInfo } from '@types';

export class SNRuntime {
  static info: SNDataInfo;
  static score: string[];
  static lyric: string[] | undefined;

  constructor(data: SNData) {
    SNRuntime.info = data.info;
    SNRuntime.score = data.score;
    SNRuntime.lyric = data.lyric;
  }
}
