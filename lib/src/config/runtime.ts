import { TemplateParser, AbcParser } from '@core';
import {
  SNData,
  SNDataInfo,
  SNDataType,
  SNStaveOptions,
  SNTemplate,
} from '@types';

export class SNRuntime {
  static info: SNDataInfo;
  static score: string;
  static parsedScore: SNStaveOptions[];
  static lyric: string;
  static splitLyrics: (string | string[])[] = [];

  /**
   * 构造函数，根据type选择不同的数据解析方式
   * @param data - 简谱数据
   * @param type - 数据类型，默认为模板写法
   */
  constructor(data: SNData, type: SNDataType = SNDataType.TEMPLATE) {
    if (type === SNDataType.ABC) {
      const { info, score, parsedScore } = new AbcParser().parse(
        data as string,
      );
      SNRuntime.parsedScore = parsedScore;
      SNRuntime.info = info!;
      SNRuntime.score = score || '';
      SNRuntime.lyric = '';
    } else {
      const { info, score, lyric } = data as SNTemplate;
      SNRuntime.info = info;
      SNRuntime.score = score;
      SNRuntime.lyric = lyric?.replaceAll('\n', '') || '';
      const { parsedScore } = new TemplateParser().parse(score);
      SNRuntime.parsedScore = parsedScore;

      // 在构造函数中调用拆分方法
      if (SNRuntime.lyric) {
        SNRuntime.splitLyrics = SNRuntime.splitLyric(SNRuntime.lyric);
      }
    }
  }

  /**
   * 清除现有内容
   */
  static clear() {
    SNRuntime.info = {
      title: '',
      composer: '',
      lyricist: '',
      time: '',
      tempo: '',
      key: '',
      beat: '',
    };
    SNRuntime.score = '';
    SNRuntime.parsedScore = [];
    SNRuntime.lyric = '';
    SNRuntime.splitLyrics = [];
  }

  /**
   * 拆分歌词片段：
   * 1. 英文单词整体为一个音（以空格分割）
   * 2. 括号包裹内容整体为一个音（支持中英文括号）
   * 3. 标点附加到前一个音
   * 4. 其它字符（如中文）按单字处理
   * @param fragment 歌词片段
   * @returns 拆分后的数组
   */
  private static splitLyricFragment(fragment: string): string[] {
    const punctuation = ['，', ',', '。', '.', '！', '!', '？', '?', ';', '；'];
    const openBrackets = ['(', '（'];
    const closeBrackets = [')', '）'];
    const arr: string[] = [];
    let i = 0;
    while (i < fragment.length) {
      const char = fragment[i];
      // 括号包裹内容整体为一个音
      if (openBrackets.includes(char)) {
        let j = i + 1;
        let content = '';
        while (j < fragment.length && !closeBrackets.includes(fragment[j])) {
          content += fragment[j];
          j++;
        }
        // 跳过右括号
        if (j < fragment.length && closeBrackets.includes(fragment[j])) {
          i = j;
        }
        arr.push(content);
      } else if (/[a-zA-Z0-9]/.test(char)) {
        // 英文单词整体为一个音
        let word = char;
        let j = i + 1;
        while (j < fragment.length && /[a-zA-Z0-9]/.test(fragment[j])) {
          word += fragment[j];
          j++;
        }
        arr.push(word);
        i = j - 1;
      } else if (punctuation.includes(char)) {
        // 标点附加到前一个音
        if (arr.length > 0) {
          arr[arr.length - 1] += char;
        }
      } else if (char === ' ') {
        // 跳过空格（英文分词已处理）
      } else {
        // 中文或其它单字
        arr.push(char);
      }
      i++;
    }
    return arr;
  }

  /**
   * 拆分歌词，支持普通单行和竖排多行歌词格式。
   * 1. 普通字符串按单字、英文单词、-、逗号等规则拆分
   * 2. 遇到连续的 [1.内容][2.内容][3.内容] 结构时，
   *    自动按竖排多行歌词合并为数组，数组下标为行号-1
   * 例如：
   *   我的[1.第一部分][2.第二部分][3.第三部分]都结束了
   *   => ['我','的',['第','第','第'],['一','二','三'],'都','结','束','了']
   * @param lyric 原始歌词字符串
   * @returns 拆分后的歌词数组，单字或竖排多行数组
   */
  static splitLyric(lyric: string): (string | string[])[] {
    const result: (string | string[])[] = [];
    let i = 0;
    const len = lyric.length;
    const multiLineRegex = /\[(\d+)\.([^\]]*)\]/y; // sticky flag for position matching
    let fragment = '';
    while (i < len) {
      if (lyric[i] === '[') {
        // 先处理前面累积的普通片段
        if (fragment) {
          const arr = this.splitLyricFragment(fragment);
          for (const ch of arr) result.push(ch);
          fragment = '';
        }
        // 处理一组连续的多行歌词（直到遇到非[数字.内容]或下一个非[开头）
        const multiLineBlocks: { line: number; content: string }[] = [];
        let tempIdx = i;
        let firstLineNum: number | null = null;
        while (true) {
          multiLineRegex.lastIndex = tempIdx;
          const match = multiLineRegex.exec(lyric);
          if (match) {
            const lineNum = parseInt(match[1]);
            if (firstLineNum === null) {
              firstLineNum = lineNum;
            } else if (lineNum === 1 && multiLineBlocks.length > 0) {
              // 新一组多行歌词开始，跳出本组
              break;
            }
            multiLineBlocks.push({
              line: lineNum,
              content: match[2],
            });
            tempIdx = multiLineRegex.lastIndex;
          } else {
            break;
          }
        }
        if (multiLineBlocks.length > 0) {
          // 按行号排序
          multiLineBlocks.sort((a, b) => a.line - b.line);
          // 每一行都用 splitLyricFragment 拆分
          const splitLines = multiLineBlocks.map((b) =>
            this.splitLyricFragment(b.content),
          );
          // 竖排合并
          const maxLen = Math.max(...splitLines.map((arr) => arr.length));
          for (let col = 0; col < maxLen; col++) {
            const vertical: string[] = [];
            for (let row = 0; row < splitLines.length; row++) {
              vertical.push(splitLines[row][col] || '');
            }
            result.push(vertical);
          }
          i = tempIdx;
          continue;
        }
      }
      // 普通字符，累积到fragment
      const char = lyric[i];
      if (char !== ' ' && char !== '\n') {
        fragment += char;
      }
      i++;
    }
    // 处理最后一个片段
    if (fragment) {
      const arr = this.splitLyricFragment(fragment);
      for (const ch of arr) result.push(ch);
    }
    return result;
  }
}
