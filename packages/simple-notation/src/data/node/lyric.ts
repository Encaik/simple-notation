import { SNParserNode } from '@data/node';

/**
 * 歌词对齐类型（根据 ABC 标准 v2.1）
 * @see https://abcnotation.com/wiki/abc:standard:v2.1#lyrics
 */
export type SNLyricAlignmentType =
  | 'normal' // 正常对齐（一个音节对应一个音符）
  | 'syllable-split' // 音节分割（- 将一个单词分成多个音节对应多个音符）
  | 'multi-syllable' // 多音节单词（\- 多音节单词对齐到单个音符）
  | 'multi-word' // 多词同音符（~ 多个单词对齐到单个音符）
  | 'extended' // 延长音（_ 多个音符对齐到单个音节）
  | 'skip'; // 跳过（* 跳过音符，不显示歌词）

/**
 * 歌词（Lyric）节点
 *
 * 表示一个歌词音节，关联到音符、休止符或其他音乐元素。
 * 支持多种对齐方式，符合 ABC 标准 v2.1。
 *
 * 设计说明：
 * - targetId: 关联的元素ID（可以是音符、休止符、连音等）
 * - targetType: 关联的元素类型
 * - syllable: 歌词音节内容
 * - alignmentType: 对齐类型（正常、音节分割、多音节等）
 * - skip: 是否跳过（* 符号，不显示歌词）
 * - verseNumber: 所属歌词行号（w: 为 0, W: 为 1, 2, 3...）
 *
 * @see https://abcnotation.com/wiki/abc:standard:v2.1#lyrics
 */
export class SNParserLyric extends SNParserNode {
  /** 关联的元素ID（可以是音符、休止符、连音等任何 SNParserElement） */
  targetId: string;
  /** 关联的元素类型 */
  targetType: 'note' | 'rest' | 'tuplet' | 'tie' | 'chord';
  /** 歌词音节内容 */
  syllable: string;
  /** 对齐类型（根据 ABC 标准） */
  alignmentType: SNLyricAlignmentType;
  /** 是否跳过（* 符号，不显示歌词） */
  skip: boolean;
  /** 所属歌词行号（w: 为 0, W: 为 1, 2, 3...） */
  verseNumber: number;
  /**
   * 获取关联的元素ID（向后兼容）
   *
   * @deprecated 保留用于向后兼容，建议使用 targetId
   * @returns 关联的元素ID
   */
  get noteId(): string {
    return this.targetId;
  }

  /**
   * 创建歌词节点
   *
   * @param id 节点唯一标识符
   * @param originStr 原始字符串（用于调试和追溯）
   * @param targetId 关联的元素ID（可选，向后兼容 noteId）
   * @param targetType 关联的元素类型（可选，默认 'note'）
   * @param syllable 歌词音节内容（必填）
   * @param alignmentType 对齐类型（默认 'normal'）
   * @param skip 是否跳过（默认 false）
   * @param verseNumber 所属歌词行号（默认 0）
   * @param noteId 向后兼容参数，建议使用 targetId
   */
  constructor({
    id,
    originStr,
    targetId,
    targetType,
    syllable,
    alignmentType = 'normal',
    skip = false,
    verseNumber = 0,
    noteId, // 向后兼容参数
  }: Pick<SNParserNode, 'id' | 'originStr'> & {
    targetId?: string;
    targetType?: 'note' | 'rest' | 'tuplet' | 'tie' | 'chord';
    syllable: string;
    alignmentType?: SNLyricAlignmentType;
    skip?: boolean;
    verseNumber?: number;
    noteId?: string; // 向后兼容
  }) {
    super({ id, originStr, type: 'lyric' });
    // 支持向后兼容：如果只提供了 noteId，自动推断为 note 类型
    this.targetId = targetId || noteId || '';
    this.targetType = targetType || (noteId ? 'note' : 'note');
    this.syllable = syllable;
    this.alignmentType = alignmentType;
    this.skip = skip;
    this.verseNumber = verseNumber;
  }
}
