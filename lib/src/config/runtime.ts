import { SNData, SNDataInfo } from '@types';

export class SNRuntime {
  static info: SNDataInfo;
  static score: string;
  static lyric: string;
  static splitLyrics: string[] = [];

  constructor(data: SNData) {
    SNRuntime.info = data.info;
    SNRuntime.score = data.score;
    SNRuntime.lyric = data.lyric?.replaceAll('\n', '') || '';
    // 在构造函数中调用拆分方法
    if (SNRuntime.lyric) {
      SNRuntime.splitLyrics = SNRuntime.splitLyric(SNRuntime.lyric);
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
