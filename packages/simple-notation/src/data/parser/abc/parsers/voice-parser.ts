import { SNTimeUnit } from '@core/model/ticks';
import { SNVoiceMetaClef } from '@data/model';
import { SNParserVoice, SNParserNode } from '@data/node';
import { parseMeasure } from './measure-parser';
import { extractLyricLines, parseLyrics } from './lyric-parser';
import { generateId } from '@core/utils';

/**
 * Voice 解析选项
 */
export interface VoiceParseOptions {
  /** ID 生成器（可选，默认使用全局生成器） */
  getNextId?: (prefix: string) => string;
}

/**
 * 解析 Voice（函数式）
 *
 * @param voiceData - Voice 数据字符串
 * @param options - 解析选项
 * @returns Voice 节点
 *
 * @example
 * ```typescript
 * const voice = parseVoice(voiceData);
 * ```
 */
export function parseVoice(
  voiceData: string,
  options?: VoiceParseOptions,
): SNParserVoice {
  const getNextIdFunc = options?.getNextId || generateId;
  const { voiceMeta, measuresContent } = extractVoiceMeta(voiceData);

  const voice = new SNParserVoice({
    id: generateVoiceId(voiceMeta.voiceNumber, voiceMeta.name),
    originStr: voiceData,
  }).setMeta({
    voiceNumber: voiceMeta.voiceNumber,
    name: voiceMeta.name,
    clef: voiceMeta.clef,
    transpose: voiceMeta.transpose,
  });

  // 提取歌词
  const lyricLines = extractLyricLines(measuresContent);

  // 分割小节
  const musicMeasures = extractMusicMeasures(measuresContent);

  // 解析歌词
  const lyricsMap = parseLyrics(lyricLines, musicMeasures);

  // 获取父节点的时间单位
  const parentTimeUnit = getParentTimeUnit(voice);

  // 解析小节
  const measures = musicMeasures.map((measureData, i) => {
    const lyricsForMeasure = lyricsMap?.get(i) || [];
    return parseMeasure(measureData, {
      index: i + 1,
      lyrics: lyricsForMeasure,
      timeUnit: parentTimeUnit,
      getNextId: getNextIdFunc,
    });
  });

  return voice.addChildren(measures);
}

/**
 * 提取 Voice 元数据
 */
function extractVoiceMeta(voiceData: string): {
  voiceMeta: {
    voiceNumber: string;
    name: string;
    clef: SNVoiceMetaClef;
    transpose?: number;
  };
  measuresContent: string;
} {
  const voiceMatch = voiceData.match(
    /^\s*V:\s*(\d+)\s*(?<metaLine>.*?)(?:\r?\n|$)(?<measuresContent>.*)$/s,
  );

  let voiceNumber = '1';
  let metaLine = '';
  let measuresContent = voiceData.trim();

  if (voiceMatch) {
    voiceNumber = voiceMatch[1];
    metaLine = voiceMatch.groups?.metaLine || '';
    measuresContent = voiceMatch.groups?.measuresContent || voiceData.trim();
  } else {
    // 尝试从任意位置提取 V: 标记
    const fallbackMatch = voiceData.match(/V:\s*(\d+)/);
    if (fallbackMatch) {
      voiceNumber = fallbackMatch[1];
    }
  }

  // 解析声部元数据
  const name = extractVoiceName(metaLine, voiceNumber);
  const clef = extractClef(metaLine);
  const transpose = extractTranspose(metaLine);

  return {
    voiceMeta: { voiceNumber, name, clef, transpose },
    measuresContent,
  };
}

/**
 * 提取声部名称
 */
function extractVoiceName(metaLine: string, voiceNumber: string): string {
  const nameMatch = metaLine.match(/name="([^"]+)"/);
  return nameMatch ? nameMatch[1].trim() : `Voice ${voiceNumber}`;
}

/**
 * 提取谱号
 */
function extractClef(metaLine: string): SNVoiceMetaClef {
  const clefMatch = metaLine.match(/clef=([a-z]+)/);
  return (clefMatch?.[1] as SNVoiceMetaClef) || 'treble';
}

/**
 * 提取移调信息
 */
function extractTranspose(metaLine: string): number | undefined {
  const transposeMatch = metaLine.match(/transpose=([+-]?\d+)/);
  return transposeMatch ? parseInt(transposeMatch[1], 10) : undefined;
}

/**
 * 提取音乐小节
 */
function extractMusicMeasures(measuresContent: string): string[] {
  // 移除声部标记、歌词行和注释行
  const musicContent = measuresContent
    .replace(/\[\s*V:\s*\d+\s*\]/g, '') // 移除声部标记
    .replace(/^\s*[wW]:\s*.*$/gim, '') // 移除歌词行
    .replace(/^\s*%.*$/gim, '') // 移除注释行
    .trim();

  // 分割小节并过滤有效小节
  return musicContent
    .split('|')
    .map((measure) => measure.trim())
    .filter(Boolean)
    .filter((measure) => isValidMeasure(measure));
}

/**
 * 判断是否为有效的小节
 */
function isValidMeasure(measureData: string): boolean {
  // 移除所有行内标记
  const withoutInlineFields = measureData
    .replace(/\[[A-Za-z]:[^\]]*\]/g, '')
    .trim();

  // 移除小节线标记
  const withoutBarlines = withoutInlineFields.replace(/^:|:$/g, '').trim();

  // 如果移除行内标记和小节线后还有内容，说明包含实际音乐内容
  return withoutBarlines.length > 0;
}

/**
 * 生成 Voice ID
 */
function generateVoiceId(voiceNumber: string, name: string): string {
  const sanitizedName = name.toLowerCase().replace(/\W+/g, '-');
  return `voice-${voiceNumber}-${sanitizedName}`;
}

/**
 * 从父节点获取时间单位
 */
function getParentTimeUnit(node: SNParserNode): SNTimeUnit | undefined {
  let current: SNParserNode | undefined = node.parent;
  while (current) {
    const props = current.props as any;
    if (props?.timeUnit) {
      return props.timeUnit;
    }
    current = current.parent;
  }
  return undefined;
}
