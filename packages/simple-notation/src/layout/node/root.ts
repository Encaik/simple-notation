import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';

/**
 * 根布局节点（ROOT 层级）
 *
 * 宽度：撑满SVG容器
 * 高度：根据内容撑开
 */
export class SNLayoutRoot extends SNLayoutNode {
  constructor(id: string) {
    super(id, SNLayoutNodeType.ROOT);
  }

  /**
   * 计算宽度：撑满SVG容器（减去margin）
   *
   * @param svgWidth - SVG根节点的实际宽度
   */
  calculateWidth(svgWidth?: number): this {
    if (!this.layout) return this;

    if (svgWidth !== undefined) {
      // 如果有SVG宽度，计算减去margin后的宽度
      const margin = this.layout.margin || {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
      this.layout.width = svgWidth - margin.left - margin.right;
    } else if (
      this.layout.width === null ||
      this.layout.width === 'auto' ||
      typeof this.layout.width !== 'number'
    ) {
      // 如果没有SVG宽度，设置为0表示自适应，渲染器会处理为100%
      this.layout.width = 0;
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
}
