import { SNLayoutNodeType, SNLayoutProps } from '@layout/model';
import { SNParserNode } from '@data/node';

export class SNLayoutNode {
  id: string;
  type: SNLayoutNodeType;
  parent?: SNLayoutNode;
  children?: SNLayoutNode[];
  layout?: SNLayoutProps;
  data?: SNParserNode;

  constructor({ id, type }: Pick<SNLayoutNode, 'id' | 'type'>) {
    this.id = id;
    this.type = type;
  }

  addChildren(children: SNLayoutNode | SNLayoutNode[]): this {
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

  updateLayout(layout?: SNLayoutProps): this {
    this.layout = layout;
    return this;
  }
}
