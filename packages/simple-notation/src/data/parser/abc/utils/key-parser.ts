import { SNKeySignature } from '@core/model/music';

/**
 * 调号解析工具类
 *
 * 职责：解析 ABC 格式中的各种调号表示法
 *
 * 支持格式：
 * - 基本格式：C, C#, Cb
 * - 带关键字：C major, C minor
 * - 小调简写：Amin, Am, C#min, C#m
 * - 带修饰符：C clef=bass, C instrument=piano
 */
export class KeySignatureParser {
  /**
   * 解析调号值（统一处理所有格式）
   *
   * @param value - 调号字符串（不包含 K: 前缀和方括号）
   * @returns 调号对象，解析失败返回 undefined
   *
   * @example
   * ```typescript
   * // 基本格式
   * KeySignatureParser.parse('C');      // { letter: 'C', symbol: 'natural' }
   * KeySignatureParser.parse('C#');     // { letter: 'C', symbol: 'sharp' }
   * KeySignatureParser.parse('Cb');     // { letter: 'C', symbol: 'flat' }
   *
   * // 带关键字
   * KeySignatureParser.parse('C major'); // { letter: 'C', symbol: 'natural' }
   * KeySignatureParser.parse('A minor'); // { letter: 'A', symbol: 'natural' }
   *
   * // 小调简写
   * KeySignatureParser.parse('Am');     // { letter: 'A', symbol: 'natural' }
   * KeySignatureParser.parse('Amin');   // { letter: 'A', symbol: 'natural' }
   *
   * // 带修饰符（会被忽略）
   * KeySignatureParser.parse('C clef=bass'); // { letter: 'C', symbol: 'natural' }
   * ```
   */
  static parse(value: string): SNKeySignature | undefined {
    if (!value || !value.trim()) return undefined;

    // 移除修饰符（clef=, instrument=, octave=, shift-score=, shift-sound=）
    // 只保留调号部分（第一个空格或修饰符之前的内容）
    const keyPart = value
      .split(/\s+(?:clef|instrument|octave|shift-score|shift-sound)=/i)[0]
      .trim();

    if (!keyPart) return undefined;

    // 1. 匹配基本格式：C, C#, Cb
    const basicMatch = keyPart.match(/^([A-Ga-g])([#b])?$/);
    if (basicMatch) {
      return this.createKeySignature(basicMatch[1], basicMatch[2]);
    }

    // 2. 匹配带关键字的格式：C major, C minor, C# major, Cb minor
    const withKeywordMatch = keyPart.match(
      /^([A-Ga-g])([#b])?\s+(major|minor|m)$/i,
    );
    if (withKeywordMatch) {
      return this.createKeySignature(withKeywordMatch[1], withKeywordMatch[2]);
    }

    // 3. 匹配小调简写格式：Amin, Am, C#min, C#m
    const minorShortMatch = keyPart.match(/^([A-Ga-g])([#b])?(min|m)$/i);
    if (minorShortMatch) {
      return this.createKeySignature(minorShortMatch[1], minorShortMatch[2]);
    }

    // 4. 匹配单独的关键字格式：major, minor（这种情况很少见，但为了完整性）
    if (/^(major|minor)$/i.test(keyPart)) {
      // 如果只有关键字没有字母，无法确定调号，返回 undefined
      return undefined;
    }

    return undefined;
  }

  /**
   * 解析行内调号标记 [K:...]
   *
   * 支持格式：
   * - [K:C]
   * - [K:C#]
   * - [K:Cb]
   * - [K:C major]
   * - [K:C minor]
   * - [K:Amin]
   * - [K:Am]
   *
   * @param content - 包含调号标记的字符串
   * @returns 调号对象，解析失败返回 undefined
   *
   * @example
   * ```typescript
   * KeySignatureParser.parseInline('[K:C]');                // { letter: 'C', symbol: 'natural' }
   * KeySignatureParser.parseInline('[K:Am]');               // { letter: 'A', symbol: 'natural' }
   * KeySignatureParser.parseInline('some text [K:C] more'); // { letter: 'C', symbol: 'natural' }
   * KeySignatureParser.parseInline('no key');               // undefined
   * ```
   */
  static parseInline(content: string): SNKeySignature | undefined {
    // 匹配 [K:...] 格式，支持方括号内的所有内容
    const keyMatch = content.match(/\[K:([^\]]+)\]/);
    if (!keyMatch) return undefined;

    const keyValue = keyMatch[1].trim();
    return this.parse(keyValue);
  }

  /**
   * 创建调号对象
   *
   * @param letter - 音名（A-G）
   * @param accidental - 变音记号（# 或 b）
   * @returns 调号对象
   */
  private static createKeySignature(
    letter: string,
    accidental?: string,
  ): SNKeySignature {
    return {
      letter: letter.toUpperCase(),
      symbol:
        accidental === '#' ? 'sharp' : accidental === 'b' ? 'flat' : 'natural',
    };
  }
}
