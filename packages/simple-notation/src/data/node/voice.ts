import { SNVoiceMeta } from '@data/model';
import { SNParserNode } from '@data/node';

/**
 * 声部（Voice）节点
 *
 * 表示一个声部，包含该声部的谱号、移调、调号等信息。
 * 一个 Section 可以包含多个声部（如钢琴的左右手、合唱的多个声部等）。
 *
 * 设计说明：
 * - instrument: 乐器类型（可选，用于标识声部对应的乐器）
 * - isPrimary: 是否为主声部（用于渲染优先级，主声部通常显示在最上方）
 * - meta: 存储声部特有的元数据（谱号、移调、调号等）
 */
export class SNParserVoice extends SNParserNode<SNVoiceMeta> {
  /** 乐器类型（如 "piano"、"violin"、"guitar" 等） */
  instrument?: string;
  /** 是否为主声部（渲染优先级，主声部通常显示在最上方） */
  isPrimary?: boolean;

  /**
   * 创建声部节点
   *
   * @param id 节点唯一标识符
   * @param originStr 原始字符串（用于调试和追溯）
   */
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'voice' });
  }
}
