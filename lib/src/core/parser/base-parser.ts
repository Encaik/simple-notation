import { SNData, SNDataInfo, SNNoteOptions, SNStaveOptions } from '@types';

/**
 * 抽象解析器基类，定义乐谱解析的核心方法接口
 * @abstract
 */
export abstract class BaseParser {
  /**
   * 解析入口方法，具体实现由子类定义
   * @param data - 原始乐谱数据
   * @returns 最终解析后的乐谱数据
   */
  abstract parse(data: SNData): {
    parsedScore: SNStaveOptions[];
    info?: SNDataInfo;
    lyric?: string;
    score?: string;
  };

  /**
   * 解析单个音符的数据
   * @param noteData - 音符的原始字符串数据
   * @returns 解析后的音符信息对象
   */
  abstract parseNote(noteData: string): SNNoteOptions;

  /**
   * 解析单个小节的数据
   * @param measureData - 小节的原始字符串数据
   * @param noteCount - 当前已处理的音符总数
   * @param expectedBeats - 当前小节应有的拍数（用于时值校验）
   * @returns 解析后的小节信息对象
   */
  abstract parseMeasure(
    measureData: string,
    noteCount: number,
    expectedBeats: number,
  ): {
    weight: number;
    measureNoteCount: number;
    noteOptions: SNNoteOptions[];
  };

  /**
   * 解析单个乐句中的小节数据并添加到五线谱选项中
   * @param stave - 单个乐句的原始字符串数据
   * @param noteCount - 当前已处理的音符总数
   * @param measureCount - 当前已处理的小节总数
   * @param expectedBeats - 当前小节应有的拍数（用于时值校验）
   * @param staveStartPos - 当前乐句的起始位置
   * @returns 解析后的小节信息和更新后的音符、小节总数
   */
  abstract parseStave(
    stave: string,
    noteCount: number,
    measureCount: number,
    expectedBeats: number,
    staveStartPos: number,
  ): {
    staveOption: SNStaveOptions;
    noteCount: number;
    measureCount: number;
  };

  /**
   * 解析完整的谱面数据
   * @param scoreData - 谱面的原始字符串数据
   * @returns 解析后的五线谱选项数组
   */
  abstract parseScore(scoreData: string): SNStaveOptions[];
}
