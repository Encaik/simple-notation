import {
  SNLayoutNodeType,
  SNLayoutProps,
  SNLayoutPadding,
} from '@layout/model';
import { SNParserNode } from '@data/node';

export class SNLayoutNode {
  id: string;
  type: SNLayoutNodeType;
  parent?: SNLayoutNode;
  children?: SNLayoutNode[];
  layout?: SNLayoutProps;
  data?: SNParserNode;

  constructor(id: string, type: SNLayoutNodeType) {
    this.id = id;
    this.type = type;
  }

  addChildren(children: SNLayoutNode | SNLayoutNode[]): this {
    if (!this.children) this.children = [];
    if (Array.isArray(children)) {
      children.forEach((child) => {
        child.parent = this;
        this.children?.push(child);
      });
    } else {
      children.parent = this;
      this.children?.push(children);
    }
    return this;
  }

  updateLayout(layout?: SNLayoutProps): this {
    this.layout = layout;
    return this;
  }

  /**
   * 获取父节点的padding
   *
   * @returns padding对象，如果父节点没有padding则返回默认值（全0）
   */
  getParentPadding(): SNLayoutPadding {
    if (!this.parent?.layout?.padding) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    return this.parent.layout.padding;
  }

  /**
   * 计算子节点相对于父节点的起始X坐标
   *
   * 考虑父节点的padding.left
   *
   * @returns 起始X坐标
   */
  getChildStartX(): number {
    const parentPadding = this.getParentPadding();
    return parentPadding.left;
  }

  /**
   * 计算子节点相对于父节点的起始Y坐标
   *
   * 考虑父节点的padding.top
   *
   * @returns 起始Y坐标
   */
  getChildStartY(): number {
    const parentPadding = this.getParentPadding();
    return parentPadding.top;
  }

  /**
   * 计算并更新当前节点的位置
   *
   * 如果节点有父节点，会根据父节点的padding计算位置
   * 如果节点没有父节点（如root），则保持原有位置
   *
   * @param baseX - 基础X坐标（可选，默认从父节点计算）
   * @param baseY - 基础Y坐标（可选，默认从父节点计算）
   */
  calculatePosition(baseX?: number, baseY?: number): this {
    if (!this.layout) return this;

    if (this.parent) {
      // 有父节点：从父节点计算起始位置
      const startX = baseX !== undefined ? baseX : this.getChildStartX();
      const startY = baseY !== undefined ? baseY : this.getChildStartY();

      this.layout.x = startX;
      this.layout.y = startY;
    } else {
      // 没有父节点（如root）：保持原有位置或使用传入的值
      if (baseX !== undefined) this.layout.x = baseX;
      if (baseY !== undefined) this.layout.y = baseY;
    }

    return this;
  }

  /**
   * 获取父节点的可用宽度
   *
   * 计算父节点的宽度减去padding和margin后的可用宽度
   *
   * @returns 可用宽度，如果无法计算则返回null
   */
  getParentAvailableWidth(): number | null {
    if (!this.parent?.layout) return null;

    const parentLayout = this.parent.layout;
    const parentWidth = parentLayout.width;

    // 如果父节点宽度未定义或是auto，无法计算
    if (
      parentWidth === null ||
      parentWidth === 'auto' ||
      (typeof parentWidth === 'number' && parentWidth === 0)
    ) {
      return null;
    }

    // 确保parentWidth是数字类型
    if (typeof parentWidth !== 'number') return null;

    // 计算父节点的padding和margin
    const parentPadding = this.getParentPadding();
    const parentMargin = this.parent.layout.margin || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    // 可用宽度 = 父节点宽度 - padding - margin
    const availableWidth =
      parentWidth -
      parentPadding.left -
      parentPadding.right -
      parentMargin.left -
      parentMargin.right;

    return Math.max(0, availableWidth);
  }

  /**
   * 获取当前节点的可用宽度（减去 padding）
   *
   * 计算当前节点的宽度减去padding后的可用宽度
   *
   * @returns 可用宽度，如果无法计算则返回0
   */
  getAvailableWidth(): number {
    if (!this.layout) return 0;

    const width = typeof this.layout.width === 'number' ? this.layout.width : 0;
    const padding = this.layout.padding || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    return Math.max(0, width - padding.left - padding.right);
  }

  /**
   * 计算子节点的最大宽度
   *
   * 遍历所有子节点，计算它们的最大宽度（包括位置和宽度）
   *
   * @returns 最大宽度，如果没有子节点则返回0
   */
  calculateChildrenMaxWidth(): number {
    if (!this.children || this.children.length === 0) return 0;

    let maxWidth = 0;

    for (const child of this.children) {
      if (!child.layout) continue;

      const childX = child.layout.x || 0;
      const childWidth =
        typeof child.layout.width === 'number' ? child.layout.width : 0;

      const childRight = childX + childWidth;
      maxWidth = Math.max(maxWidth, childRight);
    }

    return maxWidth;
  }

  /**
   * 计算子节点的总高度
   *
   * 基于子节点的实际位置和高度计算最大底部边界
   * 对于垂直排列的节点（Block, Line），应该计算最后一个子节点的底部边界
   * 注意：最后一个子节点的 margin.bottom 不应该计入父节点高度，因为它是用于元素之间的间距
   *
   * @returns 总高度，如果没有子节点则返回0
   */
  calculateChildrenHeight(): number {
    if (!this.children || this.children.length === 0) return 0;

    let maxBottom = 0;
    let hasValidChild = false;
    const children = this.children.filter((child) => child.layout);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child.layout) continue;

      hasValidChild = true;
      const childY = typeof child.layout.y === 'number' ? child.layout.y : 0;
      const childHeight =
        typeof child.layout.height === 'number' ? child.layout.height : 0;
      const childMargin = child.layout.margin || {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };

      // 计算子节点的底部边界
      // 如果是最后一个子节点，不包含 margin.bottom（因为它是用于元素之间的间距）
      // 如果不是最后一个子节点，包含 margin.bottom（用于与下一个元素的间距）
      const isLastChild = i === children.length - 1;
      const childBottom = isLastChild
        ? childY + childHeight
        : childY + childHeight + childMargin.bottom;
      maxBottom = Math.max(maxBottom, childBottom);
    }

    if (!hasValidChild) return 0;

    // 总高度 = 最大底部边界
    // 因为子节点的 Y 坐标已经是从 padding.top 开始计算的，所以 maxBottom 已经包含了从 padding.top 到最后一个子节点底部的所有空间
    // 父节点的高度 = maxBottom + padding.bottom（在 calculateHeight 中处理）
    return Math.max(0, maxBottom);
  }

  /**
   * 计算并更新当前节点的尺寸
   *
   * 子类可以重写此方法以实现特定的尺寸计算逻辑
   *
   * @param width - 宽度（可选）
   * @param height - 高度（可选）
   */
  calculateSize(
    width?: number | null | 'auto',
    height?: number | null | 'auto',
  ): this {
    if (!this.layout) return this;

    if (width !== undefined) this.layout.width = width;
    if (height !== undefined) this.layout.height = height;

    return this;
  }
}
