import { SNChordType } from '@data/model';
import { SNParserNode } from '@data/node';

/**
 * 和弦（Chord）节点
 *
 * 表示一个和弦标记，通常显示在乐谱上方，用于指示该位置应该演奏的和弦。
 * 例如：C、Am、Fmaj7 等。
 *
 * 设计说明：
 * - key: 和弦的根音（如 "C"、"A"、"F" 等）
 * - chordType: 和弦类型（如 "major"、"minor"、"7th" 等）
 */
export class SNParserChord extends SNParserNode {
  /** 和弦的根音（如 "C"、"A"、"F" 等） */
  key: string;
  /** 和弦类型（如 "major"、"minor"、"7th"、"major7th" 等） */
  chordType: SNChordType;

  /**
   * 创建和弦节点
   *
   * @param id 节点唯一标识符
   * @param originStr 原始字符串（用于调试和追溯）
   * @param key 和弦的根音
   * @param chordType 和弦类型
   */
  constructor({
    id,
    originStr,
    key,
    chordType,
  }: Pick<SNParserNode, 'id' | 'originStr'> & {
    key: string;
    chordType: SNChordType;
  }) {
    super({ id, originStr, type: 'chord' });
    this.key = key;
    this.chordType = chordType;
  }
}
