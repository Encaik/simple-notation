import { SNParserNode } from '@data/node';

/**
 * 休止符（Rest）节点
 *
 * 表示一个休止符，用于标记音乐中的静默时段。
 * 休止符与时值对应，例如：全休止符、二分休止符、四分休止符等。
 *
 * 设计说明：
 * - duration: 休止符的时值（以 ticks 为单位），与对应时值的音符相同
 *   例如：四分休止符的时值 = 四分音符的时值
 */
export class SNParserRest extends SNParserNode {
  /**
   * 创建休止符节点
   *
   * @param id 节点唯一标识符
   * @param originStr 原始字符串（用于调试和追溯）
   * @param duration 休止符的时值（以 ticks 为单位）
   */
  constructor({
    id,
    originStr,
    duration,
  }: Pick<SNParserNode, 'id' | 'originStr' | 'duration'>) {
    super({ id, originStr, type: 'rest' });
    this.duration = duration;
  }
}
