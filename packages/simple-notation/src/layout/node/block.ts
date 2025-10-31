import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';

/**
 * 块布局节点（BLOCK 层级）
 *
 * 表示一个块级容器，可以包含行或其他块
 */
export class SNLayoutBlock extends SNLayoutNode {
  constructor({ id }: Pick<SNLayoutNode, 'id'>) {
    super({ id, type: SNLayoutNodeType.BLOCK });
  }
}

