import { SNParserSection } from '@data/node';
import { AbcHeaderParser } from './header-parser';
import { generateId } from '@core/utils';

/**
 * Section 解析选项
 */
export interface SectionParseOptions {
  /** ID 生成器（可选，默认使用全局生成器） */
  getNextId?: (prefix: string) => string;
  /** 头部解析器（可选，默认创建新实例） */
  headerParser?: AbcHeaderParser;
}

/**
 * 解析 Section（函数式）
 *
 * @param sectionData - Section 数据字符串
 * @param options - 解析选项
 * @returns Section 节点和 Voice 内容
 *
 * @example
 * ```typescript
 * const { section, voiceContent } = parseSection(sectionData);
 * ```
 */
export function parseSection(
  sectionData: string,
  options?: SectionParseOptions,
): {
  section: SNParserSection;
  voiceContent: string;
} {
  const getNextIdFunc = options?.getNextId || generateId;
  const headerParser = options?.headerParser || new AbcHeaderParser();

  const { sectionId, rest } = extractSectionId(sectionData);
  const { headerFields, content } = splitHeaderAndContent(rest);
  const { props, meta } = headerParser.parseSectionHeader(
    headerFields,
    sectionId,
  );

  const section = new SNParserSection({
    id: sectionId || getNextIdFunc('section'),
    originStr: sectionData,
  })
    .setMeta(meta)
    .setProps(props);

  return { section, voiceContent: content };
}

/**
 * 提取 Section ID
 */
function extractSectionId(sectionData: string): {
  sectionId: string;
  rest: string;
} {
  const sectionMatch = sectionData.match(
    /^\s*S:\s*(?<sMetaValue>.*?)(?:\r?\n|$)(?<rest>.*)$/s,
  );

  if (sectionMatch?.groups) {
    return {
      sectionId: sectionMatch.groups.sMetaValue || '',
      rest: sectionMatch.groups.rest.trim(),
    };
  }

  return {
    sectionId: '',
    rest: sectionData.trim(),
  };
}

/**
 * 分割 Section 头部字段和内容
 */
function splitHeaderAndContent(sectionContent: string): {
  headerFields: string;
  content: string;
} {
  const lines = sectionContent.split(/\r?\n/).map((line) => line.trim());
  const headerLines: string[] = [];
  const contentLines: string[] = [];
  let isHeader = true;

  // Section 头部支持的字段
  const fieldRegex = /^([TMKLQCV]):/;

  for (const line of lines) {
    if (isHeader && line && fieldRegex.test(line)) {
      headerLines.push(line);
    } else {
      isHeader = false;
      contentLines.push(line);
    }
  }

  return {
    headerFields: headerLines.join('\n'),
    content: contentLines.join('\n'),
  };
}
