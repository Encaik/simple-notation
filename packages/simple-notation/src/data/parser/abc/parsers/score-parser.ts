import { SNRootMeta } from '@data/model/abc';
import { SNParserScore } from '@data/node';
import { AbcHeaderParser } from './header-parser';
import { generateId } from '@core/utils';

/**
 * Score 解析选项
 */
export interface ScoreParseOptions {
  /** ID 生成器（可选，默认使用全局生成器） */
  getNextId?: (prefix: string) => string;
  /** 头部解析器（可选，默认创建新实例） */
  headerParser?: AbcHeaderParser;
  /** 根元数据（可选） */
  rootMeta?: SNRootMeta;
}

/**
 * 解析 Score（函数式）
 *
 * @param scoreData - Score 数据字符串
 * @param options - 解析选项
 * @returns Score 节点和 Section 数据数组
 *
 * @example
 * ```typescript
 * const { score, sectionsData } = parseScore(scoreData);
 * ```
 */
export function parseScore(
  scoreData: string,
  options?: ScoreParseOptions,
): {
  score: SNParserScore;
  sectionsData: string[];
} {
  const getNextIdFunc = options?.getNextId || generateId;
  const headerParser = options?.headerParser || new AbcHeaderParser();
  const rootMeta = options?.rootMeta;

  const { head, body } = splitHeadAndBody(scoreData);
  const { id, meta, props } = headerParser.parseScoreHeader(head, rootMeta);
  const sectionsData = splitSections(body);

  const score = new SNParserScore({
    id: id || getNextIdFunc('score'),
    originStr: scoreData,
  })
    .setMeta(meta)
    .setProps(props);

  return { score, sectionsData };
}

/**
 * 分割 Score 头部和主体
 */
function splitHeadAndBody(scoreData: string): {
  head: string;
  body: string;
} {
  // 策略 1: 检查是否有 S: 标记（Section 标记）
  const sMarkerMatch = scoreData.match(/(?=\s*S:\d+\b)/s);
  if (sMarkerMatch && sMarkerMatch.index !== undefined) {
    return {
      head: scoreData.slice(0, sMarkerMatch.index).trimEnd(),
      body: scoreData.slice(sMarkerMatch.index).trimStart(),
    };
  }

  // 策略 2: 按行分割，识别头部字段
  return splitByHeaderFields(scoreData);
}

/**
 * 按头部字段分割
 */
function splitByHeaderFields(scoreData: string): {
  head: string;
  body: string;
} {
  const lines = scoreData.split(/\r?\n/);
  const headLines: string[] = [];
  const bodyLines: string[] = [];
  let isHead = true;

  // Score 头部支持的字段
  const metaLineRegex = /^\s*([TCOHZLMKQDPXGR]):/;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (isHead && trimmedLine && metaLineRegex.test(trimmedLine)) {
      headLines.push(line);
    } else {
      isHead = false;
      bodyLines.push(line);
    }
  }

  return {
    head: headLines.join('\n').trim(),
    body: bodyLines.join('\n').trim(),
  };
}

/**
 * 分割 Score 主体为多个 Section
 */
function splitSections(body: string): string[] {
  const sectionRegex = /S:.*?(?=S:|$)/gs;
  const sections = body.match(sectionRegex);

  if (sections && sections.length > 0) {
    return sections;
  }

  // 如果没有 S: 标记，整个主体作为一个 Section
  return [body];
}
