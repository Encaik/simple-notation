import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';

/**
 * 元素布局节点（ELEMENT 层级）
 *
 * 表示最小布局单元（如单个音符、歌词等）
 */
export class SNLayoutElement extends SNLayoutNode {
  constructor({ id }: Pick<SNLayoutNode, 'id'>) {
    super({ id, type: SNLayoutNodeType.ELEMENT });
  }
}

