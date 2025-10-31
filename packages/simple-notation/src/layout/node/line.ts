import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';

/**
 * 行布局节点（LINE 层级）
 *
 * 表示一行容器，可以包含多个元素
 */
export class SNLayoutLine extends SNLayoutNode {
  constructor({ id }: Pick<SNLayoutNode, 'id'>) {
    super({ id, type: SNLayoutNodeType.LINE });
  }
}
