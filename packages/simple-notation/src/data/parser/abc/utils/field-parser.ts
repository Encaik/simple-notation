import { SNContributor, SNVoiceDefinition } from '@data/model/props';
import { SNTimeSignature, SNTempo } from '@core/model/music';

/**
 * ABC 字段解析工具类
 * 
 * 职责：解析 ABC 格式中的各种信息字段（Information Fields）
 * - C: 创作者字段
 * - M: 拍号字段
 * - Q: 速度字段
 * - V: 声部定义字段
 * - T: 标题字段等
 */
export class AbcFieldParser {
  /**
   * 解析创作者信息（C: 字段）
   * 
   * 支持格式：
   * - C: 作词：张三
   * - C: 作曲：李四
   * - C: 王五（默认作曲）
   * 
   * @param value - 字段值
   * @returns 创作者对象
   * 
   * @example
   * ```typescript
   * AbcFieldParser.parseContributor('作词：张三');  // { name: '张三', role: 'lyricist' }
   * AbcFieldParser.parseContributor('作曲：李四');  // { name: '李四', role: 'composer' }
   * AbcFieldParser.parseContributor('王五');       // { name: '王五', role: 'composer' }
   * ```
   */
  static parseContributor(value: string): SNContributor {
    const lyricistMatch = value.match(/^作词[：:]\s*(.+)$/);
    const composerMatch = value.match(/^作曲[：:]\s*(.+)$/);

    if (lyricistMatch) {
      return { name: lyricistMatch[1].trim(), role: 'lyricist' };
    } else if (composerMatch) {
      return { name: composerMatch[1].trim(), role: 'composer' };
    } else {
      // 默认作为作曲者（保持向后兼容）
      return { name: value, role: 'composer' };
    }
  }

  /**
   * 解析拍号（M: 字段）
   * 
   * 支持格式：
   * - M: 4/4
   * - M: 3/4
   * - M: 6/8
   * 
   * @param value - 字段值（如 "4/4", "3/4"）
   * @returns 拍号对象或 undefined（解析失败时）
   * 
   * @example
   * ```typescript
   * AbcFieldParser.parseTimeSignature('4/4');    // { numerator: 4, denominator: 4 }
   * AbcFieldParser.parseTimeSignature('3/4');    // { numerator: 3, denominator: 4 }
   * AbcFieldParser.parseTimeSignature('invalid'); // undefined
   * ```
   */
  static parseTimeSignature(value: string): SNTimeSignature | undefined {
    const timeMatch = value.match(/^(\d+)\/(\d+)$/);
    if (!timeMatch) return undefined;

    const [, num, den] = timeMatch.map(Number);
    if (num > 0 && den > 0) {
      return { numerator: num, denominator: den };
    }
    return undefined;
  }

  /**
   * 解析速度（Q: 字段）
   * 
   * 支持格式：
   * - Q: 120
   * - Q: 1/4=120
   * - Q: "Allegro" 1/4=120
   * 
   * @param value - 字段值（如 "120", "1/4=120"）
   * @returns 速度对象或 undefined（解析失败时）
   * 
   * @example
   * ```typescript
   * AbcFieldParser.parseTempo('120');      // { value: 120, unit: 'BPM' }
   * AbcFieldParser.parseTempo('1/4=120');  // { value: 120, unit: 'BPM' }
   * AbcFieldParser.parseTempo('invalid');  // undefined
   * ```
   */
  static parseTempo(value: string): SNTempo | undefined {
    const tempoMatch = value.match(/(?:\d+\/?\d*=)?(\d+)/);
    if (!tempoMatch) return undefined;

    const bpm = parseInt(tempoMatch[1], 10);
    if (!isNaN(bpm) && bpm > 0) {
      return { value: bpm, unit: 'BPM' };
    }
    return undefined;
  }

  /**
   * 解析声部定义（V: 字段）
   * 
   * 支持格式：
   * - V: 1
   * - V: 1 name="Melody"
   * - V: 1 name="Melody" clef=treble
   * - V: 1 name="Melody" clef=treble transpose=2
   * 
   * @param value - 字段值（如 '1 name="Melody" clef=treble'）
   * @returns 声部定义对象或 undefined（解析失败时）
   * 
   * @example
   * ```typescript
   * AbcFieldParser.parseVoiceDefinition('1');
   * // { voiceNumber: '1', name: 'Voice 1', clef: 'treble' }
   * 
   * AbcFieldParser.parseVoiceDefinition('1 name="Melody" clef=bass');
   * // { voiceNumber: '1', name: 'Melody', clef: 'bass' }
   * 
   * AbcFieldParser.parseVoiceDefinition('2 name="Harmony" transpose=2');
   * // { voiceNumber: '2', name: 'Harmony', clef: 'treble', transpose: 2 }
   * ```
   */
  static parseVoiceDefinition(value: string): SNVoiceDefinition | undefined {
    const voiceMatch = value.match(/^(\d+)\s*(.*)$/);
    if (!voiceMatch) return undefined;

    const [, voiceNumber, metaLine] = voiceMatch;
    const name =
      metaLine.match(/name="([^"]+)"/)?.[1] || `Voice ${voiceNumber}`;
    const clefMatch = metaLine.match(/clef=([a-z]+)/);
    const clef =
      (clefMatch?.[1] as 'treble' | 'bass' | 'alto' | 'tenor') || 'treble';
    const transposeMatch = metaLine.match(/transpose=([+-]?\d+)/);
    const transpose = transposeMatch
      ? parseInt(transposeMatch[1], 10)
      : undefined;

    return {
      voiceNumber,
      name,
      clef,
      transpose,
    };
  }

  /**
   * 解析标题（T: 字段）
   * 
   * 第一个 T: 作为标题，后续的 T: 作为副标题
   * 
   * @param value - 字段值
   * @param existingTitle - 已存在的标题（可选）
   * @returns 标题或副标题
   */
  static parseTitle(
    value: string,
    existingTitle?: string,
  ): { title?: string; subtitle?: string } {
    if (!existingTitle) {
      return { title: value };
    } else {
      return { subtitle: value };
    }
  }
}

