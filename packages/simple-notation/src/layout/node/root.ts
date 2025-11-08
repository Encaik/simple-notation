import { SNLayoutNodeType } from '@layout/model';
import { SNLayoutNode } from '@layout/node';

/**
 * 根布局节点
 * 宽度：撑满SVG容器；高度：根据内容撑开
 */
export class SNLayoutRoot extends SNLayoutNode {
  constructor(id: string) {
    super(id, SNLayoutNodeType.ROOT);
  }

  /**
   * 计算宽度：撑满SVG容器（减去margin）
   * @param svgWidth - SVG根节点实际宽度
   */
  calculateWidth(svgWidth?: number): this {
    if (!this.layout) return this;

    if (svgWidth !== undefined) {
      const margin = this.layout.margin ?? {
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
      // 0表示自适应，渲染器会处理为100%
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
}
