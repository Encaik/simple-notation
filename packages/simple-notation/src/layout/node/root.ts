import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';

export class SNLayoutRoot extends SNLayoutNode {
  constructor({ id }: Pick<SNLayoutNode, 'id'>) {
    super({ id, type: SNLayoutNodeType.ROOT });
  }
}
