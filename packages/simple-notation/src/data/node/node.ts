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
}
