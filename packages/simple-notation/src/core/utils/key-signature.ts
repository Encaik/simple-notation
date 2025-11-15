import type { SNKeySignature } from '@core/model/music';
import { SNAccidental } from '@core/model/music';

/**
 * 调号到音符升降号的映射工具
 *
 * 根据调号计算每个音名字母应该的升降号
 */

/**
 * 大调调号的升降号序列
 * 升号调：F C G D A E B（顺序）
 * 降号调：B E A D G C F（顺序，与升号相反）
 */
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

/**
 * 根据调号主音计算调号类型和升降号数量
 *
 * @param keySignature - 调号对象
 * @returns 调号类型和升降号数量
 */
function calculateKeySignatureInfo(keySignature: SNKeySignature): {
  type: 'sharp' | 'flat' | 'natural';
  count: number;
} {
  const { letter, symbol } = keySignature;

  // 如果 symbol 明确指定了 sharp 或 flat，直接使用
  if (symbol === 'sharp') {
    // 升号调：根据 letter 计算升号数量
    const sharpKeys: Record<string, number> = {
      G: 1,
      D: 2,
      A: 3,
      E: 4,
      B: 5,
      'F#': 6,
      'C#': 7,
    };
    const count = sharpKeys[letter] || 0;
    return { type: 'sharp', count };
  }

  if (symbol === 'flat') {
    // 降号调：根据 letter 计算降号数量
    const flatKeys: Record<string, number> = {
      F: 1,
      Bb: 2,
      Eb: 3,
      Ab: 4,
      Db: 5,
      Gb: 6,
      Cb: 7,
    };
    const count = flatKeys[letter] || 0;
    return { type: 'flat', count };
  }

  // symbol === 'natural' 的情况，需要根据 letter 判断调号类型
  // C大调或A小调（无升降号）
  if (letter === 'C' || letter === 'A') {
    return { type: 'natural', count: 0 };
  }

  // 根据 letter 判断是大调还是小调，然后确定调号类型
  // 大调升号调：G, D, A, E, B, F#, C#
  // 大调降号调：F, Bb, Eb, Ab, Db, Gb, Cb
  // 小调升号调：E, B, F#, C#, G#, D#, A#（关系小调）
  // 小调降号调：D, G, C, F, Bb, Eb, Ab（关系小调）

  const majorSharpKeys: Record<string, number> = {
    G: 1,
    D: 2,
    A: 3,
    E: 4,
    B: 5,
    'F#': 6,
    'C#': 7,
  };

  const majorFlatKeys: Record<string, number> = {
    F: 1,
    Bb: 2,
    Eb: 3,
    Ab: 4,
    Db: 5,
    Gb: 6,
    Cb: 7,
  };

  // 优先检查大调
  if (majorSharpKeys[letter]) {
    return { type: 'sharp', count: majorSharpKeys[letter] };
  }
  if (majorFlatKeys[letter]) {
    return { type: 'flat', count: majorFlatKeys[letter] };
  }

  // 小调（关系小调）
  const minorSharpKeys: Record<string, number> = {
    E: 1, // E小调（G大调的关系小调）
    B: 2, // B小调（D大调的关系小调）
    'F#': 3, // F#小调（A大调的关系小调）
    'C#': 4, // C#小调（E大调的关系小调）
    'G#': 5, // G#小调（B大调的关系小调）
    'D#': 6, // D#小调（F#大调的关系小调）
    'A#': 7, // A#小调（C#大调的关系小调）
  };

  const minorFlatKeys: Record<string, number> = {
    D: 1, // D小调（F大调的关系小调）
    G: 2, // G小调（Bb大调的关系小调）
    C: 3, // C小调（Eb大调的关系小调）
    F: 4, // F小调（Ab大调的关系小调）
    Bb: 5, // Bb小调（Db大调的关系小调）
    Eb: 6, // Eb小调（Gb大调的关系小调）
    Ab: 7, // Ab小调（Cb大调的关系小调）
  };

  if (minorSharpKeys[letter]) {
    return { type: 'sharp', count: minorSharpKeys[letter] };
  }
  if (minorFlatKeys[letter]) {
    return { type: 'flat', count: minorFlatKeys[letter] };
  }

  // 默认无升降号
  return { type: 'natural', count: 0 };
}

/**
 * 根据调号获取指定音名字母的升降号
 *
 * @param keySignature - 调号对象
 * @param noteLetter - 音名字母（A-G）
 * @returns 该音在调号中应该的升降号
 */
export function getAccidentalFromKeySignature(
  keySignature: SNKeySignature,
  noteLetter: string,
): SNAccidental {
  const { type, count } = calculateKeySignatureInfo(keySignature);

  if (type === 'natural' || count === 0) {
    return SNAccidental.NATURAL;
  }

  if (type === 'sharp') {
    // 升号调：取前count个音
    const sharpNotes = SHARP_ORDER.slice(0, count);
    if (sharpNotes.includes(noteLetter)) {
      return SNAccidental.SHARP;
    }
  } else if (type === 'flat') {
    // 降号调：取前count个音
    const flatNotes = FLAT_ORDER.slice(0, count);
    if (flatNotes.includes(noteLetter)) {
      return SNAccidental.FLAT;
    }
  }

  return SNAccidental.NATURAL;
}
