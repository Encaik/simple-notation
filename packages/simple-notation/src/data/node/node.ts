import { SNDuration } from '@core/model/ticks';
import { SNMusicProps, SNScoreProps } from '@data/model/props';
import { SNParserNodeType } from '@data/model';

/**
 * 解析器节点的基类
 *
 * props 类型说明：
 * - Score 和 Section: 使用 SNScoreProps（包含音乐属性 + 元信息属性）
 * - Measure 等其他层级: 使用 SNMusicProps（只有音乐属性）
 */
export class SNParserNode<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  type: SNParserNodeType;
  meta?: T;
  duration?: SNDuration;
  originStr: string;
  props?: SNMusicProps | SNScoreProps | undefined;
  parent?: SNParserNode;
  children?: SNParserNode[];

  constructor({
    id,
    originStr,
    type,
  }: Pick<SNParserNode, 'id' | 'originStr' | 'type'>) {
    this.id = id;
    this.originStr = originStr;
    this.type = type;
  }

  addChildren(children: SNParserNode | SNParserNode[]): this {
    if (!this.children) this.children = [];
    if (Array.isArray(children)) {
      children.forEach((child) => {
        child.parent = this;
        this.children?.push(child);
      });
    } else {
      children.parent = this;
      this.children?.push(children);
    }
    return this;
  }

  setMeta(meta: T): this {
    this.meta = meta;
    return this;
  }

  setProps(props: SNMusicProps | SNScoreProps): this {
    this.props = props;
    return this;
  }

  setDuration(duration: SNDuration): this {
    this.duration = duration;
    return this;
  }

  /**
   * 向上查找拍号（若未设置则返回 4/4）
   *
   * 从当前节点开始向上追溯父节点，查找最近定义的拍号
   *
   * @returns 拍号对象，包含 numerator（分子）和 denominator（分母）
   */
  getTimeSignature(): { numerator: number; denominator: number } {
    let current: SNParserNode | undefined = this;
    while (current) {
      const props = current.props as SNMusicProps | SNScoreProps | undefined;
      if (
        props?.timeSignature &&
        typeof props.timeSignature.numerator === 'number' &&
        typeof props.timeSignature.denominator === 'number'
      ) {
        return {
          numerator: props.timeSignature.numerator,
          denominator: props.timeSignature.denominator,
        };
      }
      current = current.parent;
    }
    // 如果找不到，返回默认值 4/4
    return { numerator: 4, denominator: 4 };
  }
}
