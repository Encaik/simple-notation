import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';

/**
 * 行布局节点（LINE 层级）
 *
 * 表示一行容器，可以包含多个元素
 *
 * 行的宽度永远是撑满父级可用宽度
 */
export class SNLayoutLine extends SNLayoutNode {
  constructor(id: string) {
    super(id, SNLayoutNodeType.LINE);
  }

  /**
   * 计算并更新行节点的宽度
   *
   * 行总是撑满父级可用宽度
   */
  calculateWidth(): this {
    if (!this.layout) return this;

    // 行总是撑满父级宽度
    const parentAvailableWidth = this.getParentAvailableWidth();
    if (parentAvailableWidth !== null && parentAvailableWidth > 0) {
      this.layout.width = parentAvailableWidth;
    } else {
      // 如果无法从父节点获取宽度，保持为0（表示未计算）
      // 在渲染时会从父节点重新计算
      if (this.layout.width === null || this.layout.width === 'auto') {
        this.layout.width = 0;
      }
    }

    return this;
  }

  /**
   * 计算并更新行节点的尺寸
   *
   * @param width - 宽度（可选，默认撑满父级）
   * @param height - 高度（可选）
   */
  calculateSize(
    width?: number | null | 'auto',
    height?: number | null | 'auto',
  ): this {
    if (!this.layout) return this;

    // 计算宽度（默认撑满父级）
    if (width !== undefined && typeof width === 'number') {
      this.layout.width = width;
    } else {
      this.calculateWidth();
    }

    // 计算高度
    if (height !== undefined) {
      this.layout.height = typeof height === 'number' ? height : 0;
    }

    return this;
  }
}
