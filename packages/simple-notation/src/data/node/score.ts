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
 *      - timeUnit（时间单位配置，通用方案，用于确定音符、休止符、歌词等在时间序列上的位置对齐）
 *    - 元信息属性（只在 score/section 层级有）：
 *      - title, subtitle（标题、副标题）
 *      - contributors（创作者信息）
 *
 * 2. ABC 特有的元数据 → 存放在 meta 中（类型：SNScoreMeta）
 *    - origin, area（来源、地区）
 *    - notes（注释）
 *    - copyright（版权）
 *    - noteLength（ABC 特有的 L: 字段，已转换为 timeUnit 存储在 props 中）
 *    - 其他 ABC 特有字段
 *
 * 设计理念：
 * - props：存储通用布局信息（所有解析器都可能有的字段）
 * - meta：仅存储格式特有的元数据（ABC 特有的字段）
 */
export class SNParserScore extends SNParserNode<SNScoreMeta> {
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'score' });
  }
}
