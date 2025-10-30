import { SNDuration, SNScoreProps } from '@core/model';
import { SNParserNodeType } from '@data/model';

export class SNParserNode<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  type: SNParserNodeType;
  meta?: T;
  duration?: SNDuration;
  originStr: string;
  props?: SNScoreProps | undefined;
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

  setProps(props: SNScoreProps): this {
    this.props = props;
    return this;
  }

  setDuration(duration: SNDuration): this {
    this.duration = duration;
    return this;
  }
}
