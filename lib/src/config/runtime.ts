import { SNData, SNDataInfo, SNDataType } from '@types';
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
  constructor(data: SNData | string, type: SNDataType = SNDataType.TEMPLATE) {
    if (type === SNDataType.ABC) {
      // 使用abcparser解析
      const parsed = abcparser(data as string);
      console.log(parsed);

      SNRuntime.info = parsed.info;
      SNRuntime.score = parsed.score;
      SNRuntime.lyric = parsed.lyric || '';
      if (SNRuntime.lyric) {
        SNRuntime.splitLyrics = SNRuntime.splitLyric(SNRuntime.lyric);
      }
    } else {
      const temp = data as SNData;
      SNRuntime.info = temp.info;
      SNRuntime.score = temp.score;
      SNRuntime.lyric = temp.lyric?.replaceAll('\n', '') || '';
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
