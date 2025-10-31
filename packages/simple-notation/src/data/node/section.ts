import { SNParserMeta } from '@data/model';
import { SNParserNode } from '@data/node';

/**
 * Section（篇章）节点
 *
 * 数据分类：
 * 1. 通用布局渲染信息 → 存放在 props 中（类型：SNScoreProps）
 *    - 音乐属性（timeSignature, keySignature, tempo）
 *    - 元信息属性（title, subtitle, contributors）
 *
 * 2. ABC 特有的元数据 → 存放在 meta 中
 *
 * 注意：Section 可以有自己的标题和音乐属性（如转调），继承或覆盖 Score 的设置
 */
export class SNParserSection extends SNParserNode<SNParserMeta> {
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'section' });
  }
}
