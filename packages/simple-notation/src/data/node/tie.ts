import { SNParserNode } from '@data/node';

/**
 * 连音线（Tie）节点
 *
 * 表示连接两个或多个音符的连音线，用于指示演奏方式。
 *
 * 类型说明：
 * - slur: 圆滑线（连接不同音高的音符，表示圆滑演奏）
 * - tie: 延音线（连接相同音高的音符，表示时值延长）
 * - phrase: 乐句线（表示一个乐句的连贯性）
 *
 * 设计说明：
 * - style: 连音线的类型，决定渲染样式和演奏方式
 */
export class SNParserTie extends SNParserNode {
  /** 连音线类型（圆滑线、延音线、乐句线） */
  style: 'slur' | 'tie' | 'phrase';

  /**
   * 创建连音线节点
   *
   * @param id 节点唯一标识符
   * @param originStr 原始字符串（用于调试和追溯）
   * @param style 连音线类型
   */
  constructor({
    id,
    originStr,
    style,
  }: Pick<SNParserNode, 'id' | 'originStr'> & {
    style: 'slur' | 'tie' | 'phrase';
  }) {
    super({ id, originStr, type: 'tie' });
    this.style = style;
  }
}
