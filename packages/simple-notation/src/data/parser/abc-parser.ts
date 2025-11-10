import { SNAbcInput, SNParserElement } from '@data/model';
import { BaseParser } from '@data/parser';
import {
  SNParserRoot,
  SNParserScore,
  SNParserSection,
  SNParserVoice,
  SNParserMeasure,
} from '@data/node';
import {
  AbcHeaderParser,
  parseScore,
  parseSection,
  parseVoice,
  parseMeasure,
  parseElement as parseElementFunc,
} from './abc';

/**
 * ABC 解析器主类
 *
 * 职责：
 * - 统一入口，协调各函数式解析器工作
 * - 管理 ID 生成
 * - 解析 Root 层级（文件头和多个 Score）
 *
 * 架构说明：
 * - 使用函数式解析器处理不同层级
 * - Root 层级在此处理（分割文件头和 tunes）
 * - Score/Section/Voice 层级委托给对应的函数式解析器
 */
export class AbcParser extends BaseParser<SNAbcInput> {
  private currentId = 0;
  private headerParser: AbcHeaderParser;

  constructor() {
    super();
    this.headerParser = new AbcHeaderParser();
  }

  /**
   * 生成下一个ID
   */
  private getNextId(prefix: string): string {
    this.currentId++;
    return `${prefix}-${this.currentId}`;
  }

  /**
   * 主解析入口
   */
  parse(data: SNAbcInput): SNParserRoot {
    return this.parseRoot(data);
  }

  /**
   * 解析 Root（文件级别）
   *
   * 处理文件头（%% 指令）和多个 tune（每个以 X: 开头）
   */
  parseRoot(scoreCollectionData: string): SNParserRoot {
    const { fileHeader, tunesData } =
      this.splitFileHeaderAndTunes(scoreCollectionData);
    const parsedFileHeader = this.headerParser.parseFileHeader(fileHeader);

    // 提取所有 tune（以 X: 开头）
    const scoresData = this.extractScoresData(tunesData);

    // 创建 Root 节点
    const root = new SNParserRoot({
      id: this.getNextId('root'),
      originStr: scoreCollectionData,
    });

    // 设置元数据
    if (parsedFileHeader) {
      parsedFileHeader.tuneCount = scoresData.length;
      root.setMeta(parsedFileHeader);
    } else if (scoresData.length > 0) {
      root.setMeta({ tuneCount: scoresData.length });
    }

    // 解析每个 tune 并添加为子节点
    return root.addChildren(
      scoresData.map((scoreData) =>
        this.parseScore(scoreData, parsedFileHeader || undefined),
      ),
    );
  }

  /**
   * 分割文件头和 tunes 数据
   */
  private splitFileHeaderAndTunes(data: string): {
    fileHeader: string;
    tunesData: string;
  } {
    const firstTuneMatch = data.match(/^X:\s*\d+/m);

    if (!firstTuneMatch || firstTuneMatch.index === undefined) {
      return { fileHeader: '', tunesData: data };
    }

    return {
      fileHeader: data.slice(0, firstTuneMatch.index).trim(),
      tunesData: data.slice(firstTuneMatch.index).trim(),
    };
  }

  /**
   * 提取所有 Score 数据
   *
   * @param tunesData - tunes 数据字符串
   * @returns Score 数据数组
   */
  private extractScoresData(tunesData: string): string[] {
    const scoreRegex = /X:.*?(?=X:|$)/gs;
    const scores = (tunesData.match(scoreRegex) || [])
      .map((score) => score.trim())
      .filter((score) => score.length > 0);

    // 如果没有找到 X: 标记，将整个内容作为一个 tune
    if (scores.length === 0 && tunesData.trim().length > 0) {
      return [tunesData.trim()];
    }

    return scores;
  }

  /**
   * 解析 Score（委托给函数式 parseScore）
   */
  parseScore(scoreData: string, rootMeta?: any): SNParserScore {
    const { score, sectionsData } = parseScore(scoreData, {
      rootMeta,
      headerParser: this.headerParser,
      getNextId: this.getNextId.bind(this),
    });

    // 解析所有 Section
    const sectionNodes = sectionsData.map((sectionData) =>
      this.parseSection(sectionData),
    );

    return score.addChildren(sectionNodes);
  }

  /**
   * 解析 Section（委托给函数式 parseSection）
   */
  parseSection(sectionData: string): SNParserSection {
    const { section, voiceContent } = parseSection(sectionData, {
      headerParser: this.headerParser,
      getNextId: this.getNextId.bind(this),
    });

    // 解析默认声部
    const voice = this.parseVoice(voiceContent);

    return section.addChildren([voice]);
  }

  /**
   * 解析 Voice（委托给函数式 parseVoice）
   */
  parseVoice(voiceData: string): SNParserVoice {
    return parseVoice(voiceData, {
      getNextId: this.getNextId.bind(this),
    });
  }

  /**
   * 解析 Measure（委托给函数式 parseMeasure）
   */
  parseMeasure(measureData: string, index: number): SNParserMeasure {
    return parseMeasure(measureData, {
      index,
      getNextId: this.getNextId.bind(this),
    });
  }

  /**
   * 解析 Element（独立可用）
   *
   * 此方法可以独立使用，解析单个音符、休止符、连音等元素
   *
   * @param elementData - 元素数据字符串（如 'C', 'z', '(3ABC'）
   * @param options - 解析选项（可选）
   * @returns 解析后的元素节点
   *
   * @example
   * ```typescript
   * // 基本用法
   * const note = parser.parseElement('C');
   *
   * // 带选项
   * const note = parser.parseElement('C', {
   *   timeUnit: { ticksPerWhole: 48, ticksPerBeat: 12 },
   *   defaultNoteLength: 1/4
   * });
   * ```
   */
  parseElement(
    elementData: string,
    options?: {
      timeUnit?: any;
      defaultNoteLength?: number;
    },
  ): SNParserElement {
    return parseElementFunc(elementData, {
      ...options,
      getNextId: this.getNextId.bind(this),
    });
  }
}
