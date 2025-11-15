import {
  SNDecoration,
  SNDecorationType,
  DECORATION_SYMBOL_MAP,
  DECORATION_LONG_MAP,
} from '@core/model/decoration';

/**
 * ABC 装饰符解析工具类
 *
 * 职责：解析 ABC 格式中的装饰符（Decorations/Ornaments）
 *
 * 支持两种格式：
 * 1. 符号形式：. ~ H L M O P S T u v
 * 2. 长格式：!trill!, !fermata!, !marcato!
 *
 * 根据 ABC 标准 v2.1/v2.2
 * @see https://abcnotation.com/wiki/abc:standard:v2.1#decorations
 */
export class DecorationParser {
  /**
   * 从字符串中提取所有装饰符
   *
   * @param text - 包含装饰符的文本（如 "!trill!C" 或 ".C"）
   * @returns 装饰符数组和剩余文本
   *
   * @example
   * ```typescript
   * DecorationParser.extractDecorations('!trill!C');
   * // { decorations: [{ type: 'trill', text: '!trill!' }], remaining: 'C' }
   *
   * DecorationParser.extractDecorations('.C');
   * // { decorations: [{ type: 'staccato', text: '.' }], remaining: 'C' }
   *
   * DecorationParser.extractDecorations('!fermata!!trill!C');
   * // { decorations: [{ type: 'fermata', text: '!fermata!' }, { type: 'trill', text: '!trill!' }], remaining: 'C' }
   * ```
   */
  static extractDecorations(text: string): {
    decorations: SNDecoration[];
    remaining: string;
  } {
    const decorations: SNDecoration[] = [];
    let remaining = text;
    let prevRemaining = '';

    // 循环提取装饰符，直到没有更多装饰符
    while (remaining !== prevRemaining) {
      prevRemaining = remaining;

      // 1. 尝试提取长格式装饰符 !xxx!
      const longResult = this.extractLongDecoration(remaining);
      if (longResult) {
        decorations.push(longResult.decoration);
        remaining = longResult.remaining;
        continue;
      }

      // 2. 尝试提取符号形式装饰符
      // 注意：升降号符号（^, _, =）不应该被识别为装饰符
      // 它们应该在音符解析时处理
      const firstChar = remaining[0];
      if (firstChar === '^' || firstChar === '_' || firstChar === '=') {
        // 遇到升降号符号，停止提取装饰符
        break;
      }

      const symbolResult = this.extractSymbolDecoration(remaining);
      if (symbolResult) {
        decorations.push(symbolResult.decoration);
        remaining = symbolResult.remaining;
        continue;
      }

      // 如果没有找到装饰符，跳出循环
      break;
    }

    return { decorations, remaining };
  }

  /**
   * 提取长格式装饰符 !xxx!
   *
   * @param text - 文本
   * @returns 装饰符和剩余文本，如果没有找到返回 null
   */
  private static extractLongDecoration(text: string): {
    decoration: SNDecoration;
    remaining: string;
  } | null {
    // 匹配 !xxx! 格式
    const match = text.match(/^!([^!]+)!/);
    if (!match) return null;

    const [fullMatch, decorationText] = match;
    const decorationType = this.parseLongDecoration(decorationText);

    if (!decorationType) {
      // 如果无法识别，当作自定义装饰符
      return {
        decoration: {
          type: SNDecorationType.CUSTOM,
          text: fullMatch,
          parameter: decorationText,
        },
        remaining: text.slice(fullMatch.length),
      };
    }

    // 检查是否有位置参数（above/below）
    const position = this.extractPosition(decorationText);

    return {
      decoration: {
        type: decorationType,
        text: fullMatch,
        position,
      },
      remaining: text.slice(fullMatch.length),
    };
  }

  /**
   * 提取符号形式装饰符
   *
   * @param text - 文本
   * @returns 装饰符和剩余文本，如果没有找到返回 null
   */
  private static extractSymbolDecoration(text: string): {
    decoration: SNDecoration;
    remaining: string;
  } | null {
    // 检查第一个字符是否是装饰符符号
    const firstChar = text[0];
    const decorationType = DECORATION_SYMBOL_MAP[firstChar];

    if (!decorationType) return null;

    return {
      decoration: {
        type: decorationType,
        text: firstChar,
      },
      remaining: text.slice(1),
    };
  }

  /**
   * 解析长格式装饰符文本
   *
   * @param text - 装饰符文本（不包含 ! 符号）
   * @returns 装饰符类型，如果无法识别返回 null
   */
  private static parseLongDecoration(text: string): SNDecorationType | null {
    // 转换为小写并移除空格
    const normalized = text.toLowerCase().trim();

    // 查找完全匹配
    if (DECORATION_LONG_MAP[normalized]) {
      return DECORATION_LONG_MAP[normalized];
    }

    // 查找部分匹配（如 "trill-above" 匹配 "trill"）
    for (const [key, value] of Object.entries(DECORATION_LONG_MAP)) {
      if (normalized.startsWith(key)) {
        return value;
      }
    }

    return null;
  }

  /**
   * 从装饰符文本中提取位置信息
   *
   * @param text - 装饰符文本
   * @returns 位置（above 或 below），如果没有返回 undefined
   */
  private static extractPosition(text: string): 'above' | 'below' | undefined {
    const lower = text.toLowerCase();
    if (lower.includes('above')) return 'above';
    if (lower.includes('below')) return 'below';
    return undefined;
  }

  /**
   * 解析指法记号
   *
   * ABC 支持数字作为指法记号，如 1, 2, 3, 4, 5
   *
   * @param text - 文本
   * @returns 指法装饰符和剩余文本，如果没有找到返回 null
   *
   * @example
   * ```typescript
   * DecorationParser.parseFingering('1C');
   * // { decoration: { type: 'fingering', text: '1', parameter: '1' }, remaining: 'C' }
   * ```
   */
  static parseFingering(text: string): {
    decoration: SNDecoration;
    remaining: string;
  } | null {
    const match = text.match(/^([0-5])/);
    if (!match) return null;

    const [digit] = match;

    return {
      decoration: {
        type: SNDecorationType.FINGERING,
        text: digit,
        parameter: digit,
      },
      remaining: text.slice(digit.length),
    };
  }

  /**
   * 检查文本是否以装饰符开头
   *
   * @param text - 文本
   * @returns 是否以装饰符开头
   */
  static startsWithDecoration(text: string): boolean {
    if (!text) return false;

    // 检查长格式
    if (text.startsWith('!')) return true;

    // 检查符号形式
    if (DECORATION_SYMBOL_MAP[text[0]]) return true;

    return false;
  }

  /**
   * 从音符字符串中分离装饰符和音符
   *
   * @param noteStr - 音符字符串（可能包含装饰符）
   * @returns 装饰符数组和纯音符字符串
   *
   * @example
   * ```typescript
   * DecorationParser.separateDecorations('!trill!C');
   * // { decorations: [{ type: 'trill', text: '!trill!' }], noteStr: 'C' }
   *
   * DecorationParser.separateDecorations('.C');
   * // { decorations: [{ type: 'staccato', text: '.' }], noteStr: 'C' }
   * ```
   */
  static separateDecorations(noteStr: string): {
    decorations: SNDecoration[];
    noteStr: string;
  } {
    const { decorations, remaining } = this.extractDecorations(noteStr);
    return { decorations, noteStr: remaining };
  }
}
