import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';

/**
 * 元素布局节点
 * 最小布局单元（如单个音符、歌词等）
 */
export class SNLayoutElement extends SNLayoutNode {
  constructor(id: string) {
    super(id, SNLayoutNodeType.ELEMENT);
  }
}
