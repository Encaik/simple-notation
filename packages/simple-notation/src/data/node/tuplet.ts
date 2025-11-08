import { SNParserNode, SNParserNote } from '@data/node';

/**
 * 连音（Tuplet）节点
 *
 * 连音是指将固定数量的音符压缩到更短的时间内演奏。
 * 例如：三连音 (3ABC) 表示三个音符在正常情况下两个音符的时间内演奏。
 *
 * 设计说明：
 * - count: 连音中包含的音符数量
 * - duration: 连音的总时长，通常等于单个音符时值乘以 (count - 1)
 *   例如：三连音中，如果每个音符是 1/4，则连音总时长 = 1/4 * (3 - 1) = 1/2
 */
export class SNParserTuplet extends SNParserNode {
  /** 连音中包含的音符数量 */
  count: number;

  /**
   * 创建连音节点
   *
   * @param id 节点唯一标识符
   * @param originStr 原始字符串（用于调试和追溯）
   */
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'tuplet' });
    this.count = 0;
  }

  /**
   * 添加子节点（音符）并更新连音计数和时值
   *
   * 覆盖父类方法，添加连音特有的逻辑：
   * - 更新 count 为子节点数量
   * - 计算连音总时长 = 单个音符时值 * (count - 1)
   *
   * @param children 单个子节点或子节点数组（通常是音符）
   * @returns 返回当前节点实例，支持链式调用
   */
  addChildren(children: SNParserNode | SNParserNote[]): this {
    super.addChildren(children);
    this.count = this.children?.length ?? 0;
    // 计算连音总时长：单个音符时值 * (count - 1)
    // 例如：三连音中，如果每个音符是 12 ticks，则连音总时长 = 12 * (3 - 1) = 24 ticks
    if (this.children && this.children.length > 0) {
      const firstNoteDuration = this.children[0].duration || 0;
      this.duration = firstNoteDuration * (this.count - 1);
    }
    return this;
  }
}
