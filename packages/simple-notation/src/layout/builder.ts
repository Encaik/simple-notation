import { SNParserRoot } from '@data/node';
import { SNLayoutNode, SNLayoutRoot } from '@layout/node';

export class SNLayoutBuilder {
  layoutTree: SNLayoutNode;

  constructor(dataTree: SNParserRoot) {
    this.layoutTree = this.build(dataTree);
  }

  private build(dataTree: SNParserRoot): SNLayoutRoot {
    return new SNLayoutRoot({ id: '1' }).addChildren([]).updateLayout();
  }

  getLayoutTree(): SNLayoutRoot {
    return this.layoutTree;
  }
}
