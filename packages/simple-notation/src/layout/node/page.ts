import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';

/**
 * 页面布局节点（PAGE 层级）
 *
 * 表示一个页面容器，包含多个块或行
 */
export class SNLayoutPage extends SNLayoutNode {
  constructor(id: string) {
    super(id, SNLayoutNodeType.PAGE);
  }
}
