import { SNTimeUnit } from '@core/model/ticks';
import { SNBarline } from '@core/model/music';
import { SNMeasureMeta } from '@data/model';
import { SNParserLyric, SNParserMeasure, SNParserNode } from '@data/node';
import { SNMusicProps } from '@data/model/props';
import {
  validateMeasureDuration,
  getTimeUnitFromNode,
  calculateStartPosition,
  calculateEndPosition,
  generateId,
} from '@core/utils';
import { parseElement, getDefaultNoteLength } from './element-parser';
import { AbcTokenizer, KeySignatureParser } from '../utils';
import type { LyricInfo } from './lyric-parser';

/**
 * 小节解析选项
 */
export interface MeasureParseOptions {
  /** 小节索引（从 1 开始） */
  index: number;
  /** 小节的歌词信息（可选） */
  lyrics?: LyricInfo[];
  /** 父节点的时间单位（可选） */
  timeUnit?: SNTimeUnit;
  /** 行内声部标记（可选） */
  voiceId?: string;
  /** ID 生成器（可选，默认使用全局生成器） */
  getNextId?: (prefix: string) => string;
}

/**
 * 解析小节（函数式）
 *
 * @param measureData - 小节数据字符串
 * @param options - 解析选项
 * @returns 解析后的小节节点
 *
 * @example
 * ```typescript
 * // 基本小节
 * const measure = parseMeasure('C D E F', { index: 1 });
 *
 * // 带选项的小节
 * const measure = parseMeasure('C D E F', {
 *   index: 1,
 *   lyrics: [
 *     { syllable: 'do', alignmentType: 'normal', skip: false, verse: 0 }
 *   ],
 *   timeUnit: { ticksPerWhole: 48, ticksPerBeat: 12 }
 * });
 * ```
 */
export function parseMeasure(
  measureData: string,
  options: MeasureParseOptions,
): SNParserMeasure {
  const getNextIdFunc = options.getNextId || generateId;
  const {
    index,
    lyrics: lyricsForMeasure,
    timeUnit: parentTimeUnit,
    voiceId,
  } = options;

  // 解析行内调号标记 [K:C]（出现在小节线之前）
  const keySignature = KeySignatureParser.parseInline(measureData);

  // 解析行内声部标记 [V:数字]（出现在小节线之前）
  const voiceMatch = measureData.match(/\[\s*V:\s*(\d+)\s*\]/);
  const measureVoiceId = voiceMatch ? voiceMatch[1] : voiceId;

  // 解析小节线
  const barline = parseBarline(measureData);

  // 移除所有行内标记和小节线标记
  let elementsData = measureData
    // 移除所有行内标记 [K:...], [V:...], [M:...], [Q:...] 等
    .replace(/\[[A-Za-z]:[^\]]*\]/g, '')
    // 移除小节线标记（: 开头或结尾）
    .replace(/^:|:$/g, '')
    .trim();

  // 创建小节节点
  const measure = new SNParserMeasure({
    id: getNextIdFunc('measure'),
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

  // 将该小节的歌词信息添加到 meta 中（支持多段歌词）
  if (lyricsForMeasure && lyricsForMeasure.length > 0) {
    measureMeta.lyrics = organizeLyricsByVerse(lyricsForMeasure);
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
  const elements = parseElements(
    elementsData,
    lyricsForMeasure,
    timeUnit,
    measure,
    getNextIdFunc,
  );

  // 计算元素的位置信息（startPosition 和 endPosition）
  let currentPosition = 0;
  const elementsWithPosition = elements.map((element) => {
    if (element.duration !== undefined) {
      const startPosition = calculateStartPosition(currentPosition);
      const endPosition = calculateEndPosition(startPosition, element.duration);
      (element as any).startPosition = startPosition;
      (element as any).endPosition = endPosition;
      currentPosition = endPosition;
    }
    return element;
  });

  // 验证小节时值
  const timeSignature = getParentTimeSignature(measure) || {
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
 */
function parseElements(
  elementsData: string,
  lyricsForMeasure: LyricInfo[] | undefined,
  timeUnit: SNTimeUnit | undefined,
  measure: SNParserMeasure,
  getNextId: (prefix: string) => string,
): SNParserNode[] {
  const tokens = AbcTokenizer.tokenize(elementsData);
  const elements: SNParserNode[] = [];
  const defaultNoteLengthValue = getDefaultNoteLength(measure);

  let lyricIndex = 0;

  for (const token of tokens) {
    // 跳过行内标记（已在 parseMeasure 中处理）
    if (isInlineField(token)) {
      continue;
    }

    const element = tryParseElement(
      token,
      timeUnit,
      defaultNoteLengthValue,
      getNextId,
    );
    if (!element) {
      continue;
    }

    elements.push(element);

    // 关联歌词
    lyricIndex = attachLyricsIfNeeded(
      element,
      lyricsForMeasure,
      lyricIndex,
      getNextId,
    );
  }

  return elements;
}

/**
 * 尝试解析元素（捕获异常）
 */
function tryParseElement(
  token: string,
  timeUnit: SNTimeUnit | undefined,
  defaultNoteLength: number,
  getNextId: (prefix: string) => string,
): SNParserNode | null {
  try {
    return parseElement(token, {
      timeUnit,
      defaultNoteLength,
      getNextId,
    });
  } catch (error) {
    console.warn(`跳过无法解析的元素: ${token}`, error);
    return null;
  }
}

/**
 * 根据需要关联歌词
 */
function attachLyricsIfNeeded(
  element: SNParserNode,
  lyricsForMeasure: LyricInfo[] | undefined,
  currentIndex: number,
  getNextId: (prefix: string) => string,
): number {
  if (!lyricsForMeasure) {
    return isElementSupportLyric(element.type)
      ? currentIndex + 1
      : currentIndex;
  }

  if (element.type === 'tuplet') {
    return handleTupletLyrics(
      element,
      lyricsForMeasure,
      currentIndex,
      getNextId,
    );
  }

  if (isElementSupportLyric(element.type)) {
    attachLyricsToElement(element, lyricsForMeasure, currentIndex, getNextId);
    return currentIndex + 1;
  }

  return currentIndex;
}

/**
 * 将歌词按 verse 组织（用于存储在小节 meta 中）
 */
function organizeLyricsByVerse(lyricsForMeasure: LyricInfo[]): Array<{
  verse: number;
  syllables: string[];
}> {
  // 按 verse 分组
  const verseMap = new Map<number, string[]>();

  for (const lyric of lyricsForMeasure) {
    if (!verseMap.has(lyric.verse)) {
      verseMap.set(lyric.verse, []);
    }
    verseMap.get(lyric.verse)!.push(lyric.syllable);
  }

  // 转换为数组并排序
  return Array.from(verseMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([verse, syllables]) => ({ verse, syllables }));
}

/**
 * 将歌词附加到元素
 */
function attachLyricsToElement(
  element: SNParserNode,
  lyricsForMeasure: LyricInfo[],
  elementIndex: number,
  getNextId: (prefix: string) => string,
): void {
  const lyricInfo = lyricsForMeasure[elementIndex];

  if (lyricInfo && !lyricInfo.skip) {
    const lyric = new SNParserLyric({
      id: getNextId('lyric'),
      originStr: lyricInfo.syllable,
      targetId: element.id,
      targetType: element.type as 'note' | 'rest' | 'tuplet' | 'tie' | 'chord',
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
function handleTupletLyrics(
  element: SNParserNode,
  lyricsForMeasure: LyricInfo[] | undefined,
  elementIndex: number,
  getNextId: (prefix: string) => string,
): number {
  const tupletNotes = (element.children || []).filter((c) =>
    isElementSupportLyric(c.type),
  );

  if (lyricsForMeasure) {
    tupletNotes.forEach((note) => {
      attachLyricsToElement(note, lyricsForMeasure, elementIndex, getNextId);
      elementIndex++;
    });
  } else {
    elementIndex += tupletNotes.length;
  }

  return elementIndex;
}

/**
 * 判断是否为行内标记
 */
function isInlineField(token: string): boolean {
  return /^\[[A-Za-z]:[^\]]*\]$/.test(token);
}

/**
 * 判断元素类型是否支持歌词
 */
function isElementSupportLyric(
  type: string,
): type is 'note' | 'rest' | 'tuplet' | 'tie' | 'chord' {
  return ['note', 'rest', 'tuplet', 'tie', 'chord'].includes(type);
}

/**
 * 解析小节线
 */
function parseBarline(measureData: string): SNBarline[] | undefined {
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
function getParentTimeSignature(
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
