import {
  SNData,
  SNDataInfo,
  SNDataType,
  SNStaveOptions,
  SNTemplate,
} from '@types';
import { abcparser } from '../utils/parser';

export class SNRuntime {
  static info: SNDataInfo;
  static score: string;
  static parsedScore: SNStaveOptions[];
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
    /**
     * 拆分歌词，支持：
     * 1. 中文单字、英文单词
     * 2. 连续的 - 符号
     * 3. 逗号作为前一个字的一部分
     * 4. 括号括起来的内容（如“（xxx）”或“(xxx)”）算作一个整体，存入数组时移除括号
     * @param lyric 原始歌词字符串
     * @returns 拆分后的歌词数组
     */
    const result: string[] = [];
    let currentWord = '';
    const chineseRegex = /[\u4e00-\u9fa5]/;
    const openBrackets = ['(', '（'];
    const closeBrackets = [')', '）'];
    let inBracket = false;
    let bracketContent = '';
    for (let i = 0; i < lyric.length; i++) {
      const char = lyric[i];
      // 检查是否进入括号
      if (openBrackets.includes(char)) {
        if (currentWord) {
          result.push(currentWord);
          currentWord = '';
        }
        inBracket = true;
        bracketContent = '';
        continue;
      }
      // 检查是否在括号内
      if (inBracket) {
        if (closeBrackets.includes(char)) {
          // 括号内容结束，存入数组（移除括号）
          if (bracketContent) {
            result.push(bracketContent);
          }
          inBracket = false;
          bracketContent = '';
        } else {
          bracketContent += char;
        }
        continue;
      }
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
    // 处理最后一个词
    if (inBracket && bracketContent) {
      result.push(bracketContent);
    } else if (currentWord) {
      result.push(currentWord);
    }
    return result;
  }
}
