import { SNParserNode } from '@data/node';
import type { SNScoreMeta } from '@data/model/abc';

/**
 * Score（乐谱）节点
 *
 * 数据分类（支持冗余存储）：
 * 1. 通用布局渲染信息 → 存放在 props 中（类型：SNScoreProps）
 *    - 音乐属性（所有层级都可能有）：
 *      - timeSignature（拍号）
 *      - keySignature（调号）
 *      - tempo（速度）
 *    - 元信息属性（只在 score/section 层级有）：
 *      - title, subtitle（标题、副标题）
 *      - contributors（创作者信息）
 *
 * 2. ABC 特有的元数据 → 存放在 meta 中（类型：SNScoreMeta）
 *    - 冗余存储的通用信息（同时也在 props 中）：
 *      - title, subtitle, contributors（用于追溯 ABC 来源）
 *    - ABC 特有的元数据（仅存在 meta 中）：
 *      - origin, area（来源、地区）
 *      - notes（注释）
 *      - copyright（版权）
 *      - noteLength（默认音符长度）
 *      - 其他 ABC 特有字段
 *
 * 设计理念：
 * - props：布局层统一访问，不关心具体记谱法格式
 * - meta：数据层追溯来源，知道字段来自 ABC 的哪个字段（T:, C: 等）
 */
export class SNParserScore extends SNParserNode<SNScoreMeta> {
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'score' });
  }
}
