import { SNTimeUnit } from '@core/model/ticks';
import { SNBarline } from '@core/model/music';
import { SNMeasureMeta } from '@data/model';
import { SNParserMeasure, SNParserNode } from '@data/node';
import { SNMusicProps } from '@data/model/props';
import {
  validateMeasureDuration,
  getTimeUnitFromNode,
  calculateStartPosition,
  calculateEndPosition,
} from '@core/utils/time-unit';
import { AbcElementParser } from './element-parser';
import { AbcTokenizer, KeySignatureParser } from '../utils';
import type { LyricInfo } from './lyric-parser';

/**
 * ABC 小节解析器
 *
 * 职责：解析小节内容
 * - 识别小节线（barline）
 * - 识别行内调号标记 [K:]
 * - 识别行内声部标记 [V:]
 * - 解析小节内的元素（音符、休止符等）
 * - 关联歌词到元素
 * - 验证小节时值
 */
export class AbcMeasureParser {
  private elementParser: AbcElementParser;

  constructor(getNextId: (prefix: string) => string) {
    this.elementParser = new AbcElementParser(getNextId);
  }

  /**
   * 解析小节
   *
   * @param measureData - 小节数据字符串
   * @param index - 小节索引（从 1 开始）
   * @param lyricsForMeasure - 该小节的歌词信息数组（可选）
   * @param parentTimeUnit - 父节点的时间单位（可选）
   * @param voiceId - 行内声部标记 [V:数字]（可选）
   * @returns 解析后的小节节点
   *
   * @example
   * ```typescript
   * // 基本小节
   * parser.parseMeasure('C D E F', 1);
   *
   * // 带调号标记的小节
   * parser.parseMeasure('[K:C] A B C D', 1);
   *
   * // 带声部标记的小节
   * parser.parseMeasure('[V:1] C D E F', 1);
   *
   * // 带歌词的小节
   * parser.parseMeasure('C D E F', 1, [
   *   { syllable: 'do', alignmentType: 'normal', skip: false, verse: 0 },
   *   { syllable: 're', alignmentType: 'normal', skip: false, verse: 0 }
   * ]);
   * ```
   */
  parseMeasure(
    measureData: string,
    index: number,
    lyricsForMeasure?: LyricInfo[],
    parentTimeUnit?: SNTimeUnit,
    voiceId?: string,
  ): SNParserMeasure {
    // 解析行内调号标记 [K:C]（出现在小节线之前）
    const keySignature = KeySignatureParser.parseInline(measureData);

    // 解析行内声部标记 [V:数字]（出现在小节线之前）
    const voiceMatch = measureData.match(/\[\s*V:\s*(\d+)\s*\]/);
    const measureVoiceId = voiceMatch ? voiceMatch[1] : voiceId;

    // 解析小节线
    const barline = this.parseBarline(measureData);

    // 移除小节线标记（: 开头或结尾）
    const elementsData = measureData.replace(':', '');

    // 创建小节节点
    const measure = new SNParserMeasure({
      id: `measure-${index}`,
      index,
      originStr: measureData,
    });

    // 构建小节的元数据
    const measureMeta: SNMeasureMeta = {
      barline,
    };

    // 如果小节数据中包含行内声部标记，将其存储到小节的 meta 中
    if (measureVoiceId) {
      measureMeta.voiceId = measureVoiceId;
    }

    // 如果小节数据中包含行内调号标记，将其存储到小节的 props 中
    if (keySignature) {
      measure.props = {
        keySignature,
      };
    }

    // 获取时间单位
    const timeUnit = parentTimeUnit || getTimeUnitFromNode(measure);

    // 解析小节内的元素
    const elements = this.parseElements(
      elementsData,
      lyricsForMeasure,
      timeUnit,
      measure,
    );

    // 计算元素的位置信息（startPosition 和 endPosition）
    let currentPosition = 0;
    const elementsWithPosition = elements.map((element) => {
      if (element.duration !== undefined) {
        const startPosition = calculateStartPosition(currentPosition);
        const endPosition = calculateEndPosition(
          startPosition,
          element.duration,
        );
        (element as any).startPosition = startPosition;
        (element as any).endPosition = endPosition;
        currentPosition = endPosition;
      }
      return element;
    });

    // 验证小节时值
    const timeSignature = this.getParentTimeSignature(measure) || {
      numerator: 4,
      denominator: 4,
    };

    if (timeUnit) {
      const validation = validateMeasureDuration(
        currentPosition,
        timeSignature,
        timeUnit,
      );
      if (!validation.valid) {
        console.warn(`小节 ${index} 时值验证失败: ${validation.error}`);
      }
    }

    return measure.setMeta(measureMeta).addChildren(elementsWithPosition);
  }

  /**
   * 解析小节内的所有元素
   *
   * @param elementsData - 元素数据字符串
   * @param lyricsForMeasure - 歌词信息数组
   * @param timeUnit - 时间单位
   * @param measure - 小节节点（用于获取默认音符长度）
   * @returns 元素节点数组
   */
  private parseElements(
    elementsData: string,
    lyricsForMeasure: LyricInfo[] | undefined,
    timeUnit: SNTimeUnit | undefined,
    measure: SNParserMeasure,
  ): SNParserNode[] {
    // 从小节中移除调号标记和声部标记
    const cleanedData = elementsData
      .replace(/\[K:[^\]]+\]/g, '')
      .replace(/\[V:[^\]]+\]/g, '');

    // 使用 AbcTokenizer 进行分词
    const tokens = AbcTokenizer.tokenize(cleanedData);

    const elements: SNParserNode[] = [];
    let elementIndex = 0;

    const defaultNoteLength = AbcElementParser.getDefaultNoteLength(measure);

    for (const token of tokens) {
      try {
        const element = this.elementParser.parseElement(
          token,
          timeUnit,
          defaultNoteLength,
        );

        if (element) {
          elements.push(element);

          // 处理歌词关联
          if (lyricsForMeasure && this.isElementSupportLyric(element.type)) {
            this.attachLyricsToElement(element, lyricsForMeasure, elementIndex);
            elementIndex++;
          } else if (element.type === 'tuplet') {
            // 连音的特殊处理
            elementIndex = this.handleTupletLyrics(
              element,
              lyricsForMeasure,
              elementIndex,
            );
          } else if (this.isElementSupportLyric(element.type)) {
            elementIndex++;
          }
        }
      } catch (error) {
        console.warn(`跳过无法解析的元素: ${token}`, error);
      }
    }

    return elements;
  }

  /**
   * 将歌词附加到元素
   */
  private attachLyricsToElement(
    element: SNParserNode,
    lyricsForMeasure: LyricInfo[],
    elementIndex: number,
  ): void {
    const lyricInfo = lyricsForMeasure[elementIndex];

    if (lyricInfo && !lyricInfo.skip) {
      const { SNParserLyric } = require('@data/node');
      const lyric = new SNParserLyric({
        id: `lyric-${element.id}`,
        originStr: lyricInfo.syllable,
        targetId: element.id,
        targetType: element.type as
          | 'note'
          | 'rest'
          | 'tuplet'
          | 'tie'
          | 'chord',
        syllable: lyricInfo.syllable,
        alignmentType: lyricInfo.alignmentType,
        skip: lyricInfo.skip,
        verseNumber: lyricInfo.verse,
      });
      element.addChildren(lyric);
    }
  }

  /**
   * 处理连音的歌词关联
   */
  private handleTupletLyrics(
    element: SNParserNode,
    lyricsForMeasure: LyricInfo[] | undefined,
    elementIndex: number,
  ): number {
    const tupletNotes = (element.children || []).filter((c) =>
      this.isElementSupportLyric(c.type),
    );

    if (lyricsForMeasure) {
      tupletNotes.forEach((note) => {
        this.attachLyricsToElement(note, lyricsForMeasure, elementIndex);
        elementIndex++;
      });
    } else {
      elementIndex += tupletNotes.length;
    }

    return elementIndex;
  }

  /**
   * 判断元素类型是否支持歌词
   */
  private isElementSupportLyric(
    type: string,
  ): type is 'note' | 'rest' | 'tuplet' | 'tie' | 'chord' {
    return ['note', 'rest', 'tuplet', 'tie', 'chord'].includes(type);
  }

  /**
   * 解析小节线
   *
   * @param measureData - 小节数据
   * @returns 小节线数组或 undefined
   */
  private parseBarline(measureData: string): SNBarline[] | undefined {
    const barlines: SNBarline[] = [];
    if (measureData.startsWith(':')) {
      barlines.push({
        id: `barline-repeat-start`,
        type: 'barline',
        style: 'repeat-start',
      });
    }
    if (measureData.endsWith(':')) {
      barlines.push({
        id: `barline-repeat-end`,
        type: 'barline',
        style: 'repeat-end',
      });
    }
    return barlines.length ? barlines : undefined;
  }

  /**
   * 从父节点获取拍号
   */
  private getParentTimeSignature(
    node: SNParserNode,
  ): { numerator: number; denominator: number } | undefined {
    let current: SNParserNode | undefined = node.parent;
    while (current) {
      const props = current.props as SNMusicProps | undefined;
      if (props?.timeSignature) {
        return props.timeSignature;
      }
      current = current.parent;
    }
    return undefined;
  }
}
