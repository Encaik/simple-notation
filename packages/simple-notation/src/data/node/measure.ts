import { SNMeasureMeta } from '@data/model';
import { SNParserNode } from '@data/node';

/**
 * Measure（小节）节点
 *
 * 数据分类：
 * 1. 音乐属性（参与布局渲染）→ 存放在 props 中（类型：SNMusicProps）
 *    - timeSignature（拍号，小节内可能有变化）
 *    - keySignature（调号，小节内可能有转调）
 *    - tempo（速度，小节内可能有速度变化）
 *
 * 注意：Measure 只使用 SNMusicProps（不包含 title, subtitle, contributors），
 *       因为这些元信息只在 score/section 层级存在
 */
export class SNParserMeasure extends SNParserNode<SNMeasureMeta> {
  index: number;

  constructor({
    id,
    index,
    originStr,
  }: Pick<SNParserNode, 'id' | 'originStr'> & { index: number }) {
    super({ id, originStr, type: 'measure' });
    this.index = index;
  }
}
