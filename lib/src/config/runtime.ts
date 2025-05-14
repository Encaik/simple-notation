import { SNData, SNDataInfo, SNDataType, SNTemplate } from '@types';
import { abcparser } from '../utils/parser';

export class SNRuntime {
  static info: SNDataInfo;
  static score: string;
  static lyric: string;
  static splitLyrics: string[] = [];

  /**
   * 构造函数，根据type选择不同的数据解析方式
   * @param data - 简谱数据
   * @param type - 数据类型，默认为模板写法
   */
  constructor(data: SNData, type: SNDataType = SNDataType.TEMPLATE) {
    if (type === SNDataType.ABC) {
      const { info, score, parsedScore } = abcparser(data as string);
      console.log(parsedScore);
      SNRuntime.info = info;
      SNRuntime.score = score;
    } else {
      const { info, score, lyric } = data as SNTemplate;
      SNRuntime.info = info;
      SNRuntime.score = score;
      SNRuntime.lyric = lyric?.replaceAll('\n', '') || '';
      // 在构造函数中调用拆分方法
      if (SNRuntime.lyric) {
        SNRuntime.splitLyrics = SNRuntime.splitLyric(SNRuntime.lyric);
      }
    }
  }

  /**
   * 辅助函数：根据语言类型拆分歌词，支持中英文混合，处理连续的 - 符号，让逗号作为前面一个字的一部分
   * @param lyric 原始歌词字符串
   * @returns 拆分后的歌词数组
   */
  static splitLyric(lyric: string): string[] {
    const result: string[] = [];
    let currentWord = '';
    const chineseRegex = /[\u4e00-\u9fa5]/;

    for (let i = 0; i < lyric.length; i++) {
      const char = lyric[i];
      if (char === '-') {
        if (currentWord) {
          result.push(currentWord);
          currentWord = '';
        }
        result.push(char);
      } else if (chineseRegex.test(char)) {
        if (currentWord) {
          result.push(currentWord);
          currentWord = '';
        }
        currentWord += char;
      } else if (char === ',') {
        currentWord += char;
      } else if (char === ' ') {
        if (currentWord) {
          result.push(currentWord);
          currentWord = '';
        }
      } else {
        currentWord += char;
      }
    }

    if (currentWord) {
      result.push(currentWord);
    }

    return result;
  }
}
