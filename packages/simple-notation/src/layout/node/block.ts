import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';
import { SNLayoutRoot } from './root';

/**
 * 块布局节点（BLOCK 层级）
 *
 * 表示一个块级容器，可以包含行或其他块
 *
 * 宽度策略：
 * - 如果传入width参数，使用该值
 * - 如果未传入（undefined），默认撑满父级宽度
 */
export class SNLayoutBlock extends SNLayoutNode {
  /** 宽度参数：undefined表示撑满父级，number表示固定宽度 */
  private widthParam?: number;

  constructor(id: string, width?: number) {
    super(id, SNLayoutNodeType.BLOCK);
    this.widthParam = width;
  }

  /**
   * 计算并更新块节点的宽度
   *
   * 如果构造函数传入了width，使用该值
   * 否则撑满父级可用宽度
   */
  calculateWidth(): this {
    if (!this.layout) return this;

    if (this.widthParam !== undefined) {
      // 使用传入的宽度值
      this.layout.width = this.widthParam;
    } else {
      // 默认撑满父级宽度
      const parentAvailableWidth = this.getParentAvailableWidth();
      if (parentAvailableWidth !== null && parentAvailableWidth > 0) {
        this.layout.width = parentAvailableWidth;
      } else {
        // 如果无法从父节点获取宽度
        // 检查父节点是否是 Root 节点且宽度为 0（表示自适应）
        // 如果是，则 Block 节点也使用 0（表示自适应），渲染器会从 SVG 容器获取实际宽度
        if (
          this.parent instanceof SNLayoutRoot &&
          this.parent.layout &&
          typeof this.parent.layout.width === 'number' &&
          this.parent.layout.width === 0
        ) {
          // 父节点是 Root 且宽度为 0（自适应），Block 也应该自适应
          this.layout.width = 0;
        } else {
          // 其他情况：保持为 0（表示未计算），在渲染时会从父节点重新计算
          if (this.layout.width === null || this.layout.width === 'auto') {
            this.layout.width = 0;
          }
        }
      }
    }

    return this;
  }

  /**
   * 计算高度：根据子节点内容撑开
   */
  calculateHeight(): this {
    if (!this.layout) return this;

    const childrenHeight = this.calculateChildrenHeight();
    const padding = this.layout.padding || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    // childrenHeight 返回的是 maxBottom，即从父节点顶部（0）到最后一个子节点底部的距离
    // 这个值已经包含了 padding.top 的空间（因为子节点从 padding.top 开始）
    // 所以只需要加上 padding.bottom 即可
    this.layout.height = childrenHeight + padding.bottom;

    return this;
  }

  /**
   * 计算并更新当前节点的尺寸
   *
   * @param width - 宽度（可选）
   * @param height - 高度（可选）
   */
  calculateSize(
    width?: number | null | 'auto',
    height?: number | null | 'auto',
  ): this {
    if (!this.layout) return this;

    // 计算宽度
    if (width !== undefined) {
      this.layout.width = typeof width === 'number' ? width : 0;
    } else {
      this.calculateWidth();
    }

    // 计算高度
    if (height !== undefined) {
      this.layout.height = typeof height === 'number' ? height : 0;
    } else {
      this.calculateHeight();
    }

    return this;
  }
}
