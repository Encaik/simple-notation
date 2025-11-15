import { SNTimeUnit } from '@core/model/ticks';
import { SNAccidental } from '@core/model/music';
import { SNParserElement } from '@data/model';
import {
  SNParserNote,
  SNParserRest,
  SNParserTie,
  SNParserTuplet,
  SNParserNode,
} from '@data/node';
import { noteValueToDuration } from '@core/utils/time-unit';
import { AbcTokenizer, DecorationParser } from '../utils';
import { AbcElementParseError } from '../errors';

/**
 * 默认 ID 计数器（用于无 ID 生成器时的回退）
 */
let defaultIdCounter = 0;

/**
 * 默认 ID 生成器
 */
const defaultGetNextId = (prefix: string): string => {
  return `${prefix}-${++defaultIdCounter}`;
};

/**
 * 元素解析选项
 */
export interface ElementParseOptions {
  /** 时间单位（用于计算音符时值） */
  timeUnit?: SNTimeUnit;
  /** 默认音符长度（如 1/4, 1/8） */
  defaultNoteLength?: number;
  /** ID 生成器（可选，不提供则使用默认生成器） */
  getNextId?: (prefix: string) => string;
}

/**
 * ABC 元素解析器（函数式）
 *
 * 职责：解析小节内的音乐元素
 * - 音符（Note）
 * - 休止符（Rest）
 * - 连音（Tuplet）
 * - 连音线（Tie）
 *
 * @example
 * ```typescript
 * // 基本使用（使用默认 ID 生成器）
 * const note = parseElement('C');
 *
 * // 带选项
 * const note = parseElement('C', {
 *   timeUnit: { ticksPerWhole: 48, ticksPerBeat: 12 },
 *   defaultNoteLength: 1/4,
 *   getNextId: (prefix) => `my-${prefix}-${Date.now()}`
 * });
 * ```
 */
export function parseElement(
  elementData: string,
  options?: ElementParseOptions,
): SNParserElement {
  const getNextId = options?.getNextId || defaultGetNextId;
  const timeUnit = options?.timeUnit;
  const defaultNoteLength = options?.defaultNoteLength;

  return parseElementInternal(
    elementData,
    timeUnit,
    defaultNoteLength,
    getNextId,
  );
}

/**
 * 内部解析函数（实际解析逻辑）
 */
function parseElementInternal(
  elementData: string,
  timeUnit: SNTimeUnit | undefined,
  defaultNoteLength: number | undefined,
  getNextId: (prefix: string) => string,
): SNParserElement {
  const trimmed = elementData.trim();

  if (!trimmed) {
    throw new AbcElementParseError(elementData);
  }

  // 0. 提取装饰符（如果有）
  const { decorations, noteStr } =
    DecorationParser.separateDecorations(trimmed);

  // 1. 解析连音线
  if (noteStr === '-') {
    return new SNParserTie({
      id: getNextId('tie'),
      style: 'slur',
      originStr: elementData,
    });
  }

  // 2. 解析连音（Tuplet）
  const tupletMatch = noteStr.match(/^\((\d+)([\s\S]*?)\)?$/);
  if (tupletMatch) {
    return parseTuplet(
      tupletMatch,
      elementData,
      timeUnit,
      defaultNoteLength,
      getNextId,
    );
  }

  // 3. 解析休止符
  if (noteStr.startsWith('z')) {
    return parseRest(
      noteStr,
      elementData,
      timeUnit,
      defaultNoteLength,
      getNextId,
    );
  }

  // 4. 解析音符（带装饰符）
  // 支持整数（C4）、分数（C/2, C3/2）和简写（C/）三种时值表示
  // 升降号格式：^ (升号), ^^ (重升号), _ (降号), __ (重降号), = (还原号)
  const noteMatch = noteStr.match(
    /^(\^+|_+|=?)([A-Ga-g])([,']*)(\d+\/\d+|\/\d*|\d*)(\.*)$/,
  );
  if (noteMatch) {
    // 构建完整的 originStr，包含装饰符（如果有）和音符
    // 装饰符在音符前面，所以格式是：装饰符 + 音符
    const fullOriginStr =
      decorations.length > 0
        ? decorations.map((d) => d.text).join('') + noteStr
        : noteStr;

    const note = parseNote(
      noteMatch,
      noteStr,
      fullOriginStr, // 传入完整的 originStr（包含装饰符和音符）
      timeUnit,
      defaultNoteLength,
      getNextId,
    );
    // 将装饰符附加到音符
    if (decorations.length > 0) {
      note.decorations = decorations;
    }
    return note;
  }

  throw new AbcElementParseError(elementData);
}

/**
 * 解析连音（Tuplet）
 */
function parseTuplet(
  match: RegExpMatchArray,
  elementData: string,
  timeUnit: SNTimeUnit | undefined,
  defaultNoteLength: number | undefined,
  getNextId: (prefix: string) => string,
): SNParserTuplet {
  const [, , innerNotesStr] = match;
  const innerNotes = AbcTokenizer.tokenize(innerNotesStr);

  return new SNParserTuplet({
    id: getNextId('tuplet'),
    originStr: elementData,
  }).addChildren(
    innerNotes.map(
      (noteStr): SNParserNote =>
        parseElementInternal(
          noteStr,
          timeUnit,
          defaultNoteLength,
          getNextId,
        ) as SNParserNote,
    ),
  );
}

/**
 * 解析休止符
 */
function parseRest(
  trimmed: string,
  elementData: string,
  timeUnit: SNTimeUnit | undefined,
  defaultNoteLength: number | undefined,
  getNextId: (prefix: string) => string,
): SNParserRest {
  let duration: number;

  if (timeUnit) {
    const restStr = trimmed.slice(1);
    // 支持整数（z4）、分数（z/2, z3/2）和简写（z/）三种时值表示
    const durationStr = restStr.match(/^(\d+\/\d+|\/\d*|\d+)/)?.[1];
    const dotCount = (restStr.match(/\./g) || []).length;

    const noteValue = parseDurationString(durationStr, defaultNoteLength);

    const dottedNoteValue = calculateDottedNoteValue(noteValue, dotCount);
    duration = noteValueToDuration(dottedNoteValue, timeUnit);
  } else {
    duration = parseInt(trimmed.slice(1), 10) || 1;
  }

  return new SNParserRest({
    id: getNextId('rest'),
    duration,
    originStr: elementData,
  });
}

/**
 * 解析音符
 *
 * @param match - 正则匹配结果
 * @param noteStr - 音符字符串（用于解析，不包含装饰符）
 * @param originStr - 完整的原始字符串（包含装饰符和音符，用于 originStr）
 * @param timeUnit - 时间单位
 * @param defaultNoteLength - 默认音符长度
 * @param getNextId - ID 生成器
 */
function parseNote(
  match: RegExpMatchArray,
  noteStr: string,
  originStr: string,
  timeUnit: SNTimeUnit | undefined,
  defaultNoteLength: number | undefined,
  getNextId: (prefix: string) => string,
): SNParserNote {
  const [, accidentalStr, letter, octaveSymbols, durationStr] = match;

  // 解析变音记号
  const accidental = parseAccidental(accidentalStr);

  // 解析八度
  const baseOctave: number = letter === letter.toUpperCase() ? 3 : 4;
  const octaveOffset = octaveSymbols.split('').reduce((offset, sym) => {
    return sym === ',' ? offset - 1 : sym === "'" ? offset + 1 : offset;
  }, 0);
  const octave = baseOctave + octaveOffset;

  // 解析时值
  let duration: number;
  let dotCount = 0;
  if (timeUnit) {
    const noteValue = parseDurationString(durationStr, defaultNoteLength);

    dotCount = (noteStr.match(/\./g) || []).length;
    const dottedNoteValue = calculateDottedNoteValue(noteValue, dotCount);
    duration = noteValueToDuration(dottedNoteValue, timeUnit);
  } else {
    duration = durationStr ? parseInt(durationStr, 10) : 1;
    // 即使没有 timeUnit，也尝试从 noteStr 中提取附点数量
    dotCount = (noteStr.match(/\./g) || []).length;
  }

  return new SNParserNote({
    id: getNextId('note'),
    originStr, // 使用完整的 originStr（包含装饰符和音符）
    pitch: {
      letter: letter.toUpperCase(),
      octave,
      accidental,
    },
    duration,
    dotCount: dotCount > 0 ? dotCount : undefined,
  });
}

/**
 * 解析变音记号
 *
 * @param accidentalStr - 变音记号字符串
 * @returns 变音记号枚举值（undefined 表示没有升降号标记，NATURAL 表示明确写了还原号 =）
 */
function parseAccidental(accidentalStr: string): SNAccidental | undefined {
  // 如果没有升降号标记，返回 undefined
  if (!accidentalStr) return undefined;

  switch (accidentalStr) {
    case '^':
      return SNAccidental.SHARP;
    case '^^':
      return SNAccidental.DOUBLE_SHARP;
    case '_':
      return SNAccidental.FLAT;
    case '__':
      return SNAccidental.DOUBLE_FLAT;
    case '=':
      // 明确写了还原号，返回 NATURAL
      return SNAccidental.NATURAL;
    default:
      // 未知格式，返回 undefined（不显示升降号）
      return undefined;
  }
}

/**
 * 解析时值字符串
 *
 * 支持三种格式：
 * - 整数：4 表示 4倍默认长度（如 C4 表示全音符）
 * - 分数：3/2 表示 3/2倍默认长度
 * - 简写分数：/ 或 /2 表示 1/2倍默认长度
 *
 * @param durationStr - 时值字符串（如 "4", "/2", "3/2", "/"）
 * @param defaultNoteLength - 默认音符长度
 * @returns 音符时值（相对于全音符的比例）
 */
function parseDurationString(
  durationStr: string | undefined,
  defaultNoteLength?: number,
): number {
  const defaultLength = defaultNoteLength || 1 / 4;

  if (!durationStr) {
    return defaultLength;
  }

  // 处理分数形式：3/2, /2, /
  if (durationStr.includes('/')) {
    if (durationStr === '/') {
      // / 简写表示 1/2
      return defaultLength * 0.5;
    }

    const parts = durationStr.split('/');
    if (parts[0] === '') {
      // /2 形式：表示默认长度的 1/2
      // 例如：L:1/4 时，/2 = (1/4) × (1/2) = 1/8（八分音符）
      const denominator = parseInt(parts[1], 10);
      return defaultLength / denominator;
    } else {
      // 3/2 形式表示 3/2
      const numerator = parseInt(parts[0], 10);
      const denominator = parseInt(parts[1], 10);
      return defaultLength * (numerator / denominator);
    }
  }

  // 处理整数形式：4 表示 4倍默认长度
  const multiplier = parseInt(durationStr, 10);
  return defaultLength * multiplier;
}

/**
 * 计算带附点的音符时值
 *
 * @param noteValue - 基础音符时值
 * @param dotCount - 附点数量
 * @returns 带附点的音符时值
 */
function calculateDottedNoteValue(noteValue: number, dotCount: number): number {
  if (dotCount === 0) return noteValue;
  return noteValue * (1 + 0.5 * (1 - Math.pow(0.5, dotCount)));
}

/**
 * 获取默认音符长度
 *
 * 从父节点的 meta 中查找 noteLength 字段
 *
 * @param node - 当前节点（可选）
 * @returns 默认音符长度
 */
export function getDefaultNoteLength(node?: SNParserNode): number {
  if (node) {
    let current: SNParserNode | undefined = node.parent;
    while (current) {
      const meta = current.meta as { noteLength?: string } | undefined;
      if (meta?.noteLength) {
        const match = meta.noteLength.match(/^(\d+)\/(\d+)$/);
        if (match) {
          const [, num, den] = match.map(Number);
          return num / den;
        }
      }
      current = current.parent;
    }
  }
  return 1 / 4; // 默认四分音符
}
