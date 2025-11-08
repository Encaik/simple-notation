import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';

/**
 * 行布局节点
 * 行容器，宽度总是撑满父级可用宽度
 */
export class SNLayoutLine extends SNLayoutNode {
  constructor(id: string) {
    super(id, SNLayoutNodeType.LINE);
  }

  /**
   * 计算宽度：撑满父级可用宽度
   */
  calculateWidth(): this {
    if (!this.layout) return this;

    const parentAvailableWidth = this.getParentAvailableWidth();
    if (parentAvailableWidth !== null && parentAvailableWidth > 0) {
      this.layout.width = parentAvailableWidth;
    } else if (this.layout.width === null || this.layout.width === 'auto') {
      // 0表示未计算，渲染时会从父节点重新计算
      this.layout.width = 0;
    }

    return this;
  }

  /**
   * 计算并更新节点尺寸
   * @param width - 宽度，未提供则撑满父级
   * @param height - 高度
   */
  calculateSize(
    width?: number | null | 'auto',
    height?: number | null | 'auto',
  ): this {
    if (!this.layout) return this;

    if (width !== undefined && typeof width === 'number') {
      this.layout.width = width;
    } else {
      this.calculateWidth();
    }

    if (height !== undefined) {
      this.layout.height = typeof height === 'number' ? height : 0;
    }

    return this;
  }
}
