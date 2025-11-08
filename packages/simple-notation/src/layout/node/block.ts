import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';
import { SNLayoutRoot } from './root';

/**
 * 块布局节点
 * 块级容器，宽度：传入width则使用该值，否则撑满父级宽度
 */
export class SNLayoutBlock extends SNLayoutNode {
  /** 宽度参数：undefined表示撑满父级，number表示固定宽度 */
  private widthParam?: number;

  constructor(id: string, width?: number) {
    super(id, SNLayoutNodeType.BLOCK);
    this.widthParam = width;
  }

  /**
   * 计算宽度：使用widthParam或撑满父级可用宽度
   */
  calculateWidth(): this {
    if (!this.layout) return this;

    if (this.widthParam !== undefined) {
      this.layout.width = this.widthParam;
      return this;
    }

    const parentAvailableWidth = this.getParentAvailableWidth();
    if (parentAvailableWidth !== null && parentAvailableWidth > 0) {
      this.layout.width = parentAvailableWidth;
    } else if (
      this.parent instanceof SNLayoutRoot &&
      this.parent.layout?.width === 0
    ) {
      // 父节点是Root且宽度为0（自适应），Block也自适应
      this.layout.width = 0;
    } else if (this.layout.width === null) {
      // 0表示未计算，渲染时会从父节点重新计算
      this.layout.width = 0;
    }

    return this;
  }

  /**
   * 计算高度：根据子节点内容撑开
   * childrenHeight已包含padding.top，只需加上padding.bottom
   */
  calculateHeight(): this {
    if (!this.layout) return this;

    const childrenHeight = this.calculateChildrenHeight();
    const padding = this.layout.padding ?? {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    this.layout.height = childrenHeight + padding.bottom;
    return this;
  }

  /**
   * 计算并更新节点尺寸
   * @param width - 宽度，未提供则使用widthParam或撑满父级
   * @param height - 高度，未提供则根据子节点计算
   */
  calculateSize(width?: number | null, height?: number | null): this {
    if (!this.layout) return this;

    if (width !== undefined) {
      this.layout.width = typeof width === 'number' ? width : 0;
    } else {
      this.calculateWidth();
    }

    if (height !== undefined) {
      this.layout.height = typeof height === 'number' ? height : 0;
    } else {
      this.calculateHeight();
    }

    return this;
  }
}
