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
import { ElementParseError } from '../errors';

/**
 * ABC 元素解析器
 *
 * 职责：解析小节内的音乐元素
 * - 音符（Note）
 * - 休止符（Rest）
 * - 连音（Tuplet）
 * - 连音线（Tie）
 */
export class AbcElementParser {
  /**
   * 获取下一个ID的回调函数
   */
  private getNextId: (prefix: string) => string;

  constructor(getNextId: (prefix: string) => string) {
    this.getNextId = getNextId;
  }

  /**
   * 解析单个元素
   *
   * @param elementData - 元素数据字符串
   * @param timeUnit - 时间单位（可选）
   * @param defaultNoteLength - 默认音符长度（可选）
   * @returns 解析后的元素节点
   * @throws {ElementParseError} 当无法解析元素时抛出
   *
   * @example
   * ```typescript
   * // 解析音符
   * parser.parseElement('C');     // SNParserNote (默认长度)
   * parser.parseElement('C#');    // SNParserNote (升C)
   * parser.parseElement('C4');    // SNParserNote (4倍默认长度，如默认为1/4时为全音符)
   * parser.parseElement('C/2');   // SNParserNote (1/2倍默认长度，如默认为1/4时为八分音符)
   *
   * // 解析休止符
   * parser.parseElement('z');     // SNParserRest (默认长度)
   * parser.parseElement('z4');    // SNParserRest (4倍默认长度)
   *
   * // 解析连音线
   * parser.parseElement('-');     // SNParserTie
   *
   * // 解析连音
   * parser.parseElement('(3ABC'); // SNParserTuplet (三连音)
   * ```
   */
  parseElement(
    elementData: string,
    timeUnit?: SNTimeUnit,
    defaultNoteLength?: number,
  ): SNParserElement {
    const trimmed = elementData.trim();

    if (!trimmed) {
      throw new ElementParseError(elementData);
    }

    // 0. 提取装饰符（如果有）
    const { decorations, noteStr } =
      DecorationParser.separateDecorations(trimmed);

    // 1. 解析连音线
    if (noteStr === '-') {
      return new SNParserTie({
        id: this.getNextId('tie'),
        style: 'slur',
        originStr: elementData,
      });
    }

    // 2. 解析连音（Tuplet）
    const tupletMatch = noteStr.match(/^\((\d+)([\s\S]*?)\)?$/);
    if (tupletMatch) {
      return this.parseTuplet(
        tupletMatch,
        elementData,
        timeUnit,
        defaultNoteLength,
      );
    }

    // 3. 解析休止符
    if (noteStr.startsWith('z')) {
      return this.parseRest(noteStr, elementData, timeUnit, defaultNoteLength);
    }

    // 4. 解析音符（带装饰符）
    // 支持整数（C4）、分数（C/2, C3/2）和简写（C/）三种时值表示
    const noteMatch = noteStr.match(
      /^(\^+\/?|_+\/?|=?)([A-Ga-g])([,']*)(\d+\/\d+|\/\d*|\d*)(\.*)$/,
    );
    if (noteMatch) {
      const note = this.parseNote(
        noteMatch,
        noteStr,
        timeUnit,
        defaultNoteLength,
      );
      // 将装饰符附加到音符
      if (decorations.length > 0) {
        note.decorations = decorations;
      }
      return note;
    }

    throw new ElementParseError(elementData);
  }

  /**
   * 解析连音（Tuplet）
   */
  private parseTuplet(
    match: RegExpMatchArray,
    elementData: string,
    timeUnit?: SNTimeUnit,
    defaultNoteLength?: number,
  ): SNParserTuplet {
    const [, , innerNotesStr] = match;
    const innerNotes = AbcTokenizer.tokenize(innerNotesStr);

    return new SNParserTuplet({
      id: this.getNextId('tuplet'),
      originStr: elementData,
    }).addChildren(
      innerNotes.map(
        (noteStr): SNParserNote =>
          this.parseElement(
            noteStr,
            timeUnit,
            defaultNoteLength,
          ) as SNParserNote,
      ),
    );
  }

  /**
   * 解析休止符
   */
  private parseRest(
    trimmed: string,
    elementData: string,
    timeUnit?: SNTimeUnit,
    defaultNoteLength?: number,
  ): SNParserRest {
    let duration: number;

    if (timeUnit) {
      const restStr = trimmed.slice(1);
      // 支持整数（z4）、分数（z/2, z3/2）和简写（z/）三种时值表示
      const durationStr = restStr.match(/^(\d+\/\d+|\/\d*|\d+)/)?.[1];
      const dotCount = (restStr.match(/\./g) || []).length;

      const noteValue = this.parseDurationString(
        durationStr,
        defaultNoteLength,
      );

      const dottedNoteValue = this.calculateDottedNoteValue(
        noteValue,
        dotCount,
      );
      duration = noteValueToDuration(dottedNoteValue, timeUnit);
    } else {
      duration = parseInt(trimmed.slice(1), 10) || 1;
    }

    return new SNParserRest({
      id: this.getNextId('rest'),
      duration,
      originStr: elementData,
    });
  }

  /**
   * 解析音符
   */
  private parseNote(
    match: RegExpMatchArray,
    trimmed: string,
    timeUnit?: SNTimeUnit,
    defaultNoteLength?: number,
  ): SNParserNote {
    const [, accidentalStr, letter, octaveSymbols, durationStr] = match;

    // 解析变音记号
    const accidental = this.parseAccidental(accidentalStr);

    // 解析八度
    const baseOctave: number = letter === letter.toUpperCase() ? 3 : 4;
    const octaveOffset = octaveSymbols.split('').reduce((offset, sym) => {
      return sym === ',' ? offset - 1 : sym === "'" ? offset + 1 : offset;
    }, 0);
    const octave = baseOctave + octaveOffset;

    // 解析时值
    let duration: number;
    if (timeUnit) {
      const noteValue = this.parseDurationString(
        durationStr,
        defaultNoteLength,
      );

      const dotCount = (trimmed.match(/\./g) || []).length;
      const dottedNoteValue = this.calculateDottedNoteValue(
        noteValue,
        dotCount,
      );
      duration = noteValueToDuration(dottedNoteValue, timeUnit);
    } else {
      duration = durationStr ? parseInt(durationStr, 10) : 1;
    }

    return new SNParserNote({
      id: this.getNextId('note'),
      originStr: trimmed,
      pitch: {
        letter: letter.toUpperCase(),
        octave,
        accidental,
      },
      duration,
    });
  }

  /**
   * 解析变音记号
   *
   * @param accidentalStr - 变音记号字符串
   * @returns 变音记号枚举值
   */
  private parseAccidental(accidentalStr: string): SNAccidental {
    if (!accidentalStr) return SNAccidental.NATURAL;

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
        return SNAccidental.NATURAL;
      default:
        return SNAccidental.NATURAL;
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
  private parseDurationString(
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
  private calculateDottedNoteValue(
    noteValue: number,
    dotCount: number,
  ): number {
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
  static getDefaultNoteLength(node?: SNParserNode): number {
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
}
