import {
  SNLayoutNodeType,
  SNLayoutProps,
  SNLayoutPadding,
} from '@layout/model';
import { SNParserNode } from '@data/node';

/**
 * 布局节点基类
 */
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

  /**
   * 添加子节点
   */
  addChildren(children: SNLayoutNode | SNLayoutNode[]): this {
    if (!this.children) this.children = [];
    const childrenArray = Array.isArray(children) ? children : [children];
    childrenArray.forEach((child) => {
      child.parent = this;
      this.children!.push(child);
    });
    return this;
  }

  /**
   * 更新布局属性
   */
  updateLayout(layout?: SNLayoutProps): this {
    this.layout = layout;
    return this;
  }

  /**
   * 获取父节点的padding，无则返回全0
   */
  getParentPadding(): SNLayoutPadding {
    return (
      this.parent?.layout?.padding ?? {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }
    );
  }

  /**
   * 获取子节点起始X坐标（父节点padding.left）
   */
  getChildStartX(): number {
    return this.getParentPadding().left;
  }

  /**
   * 获取子节点起始Y坐标（父节点padding.top）
   */
  getChildStartY(): number {
    return this.getParentPadding().top;
  }

  /**
   * 计算并更新节点位置
   * @param baseX - 基础X坐标，未提供则从父节点计算
   * @param baseY - 基础Y坐标，未提供则从父节点计算
   */
  calculatePosition(baseX?: number, baseY?: number): this {
    if (!this.layout) return this;

    if (this.parent) {
      this.layout.x = baseX ?? this.getChildStartX();
      this.layout.y = baseY ?? this.getChildStartY();
    } else {
      if (baseX !== undefined) this.layout.x = baseX;
      if (baseY !== undefined) this.layout.y = baseY;
    }

    return this;
  }

  /**
   * 获取父节点可用宽度（减去padding和margin）
   * @returns 可用宽度，无法计算则返回null
   */
  getParentAvailableWidth(): number | null {
    const parentLayout = this.parent?.layout;
    if (!parentLayout) return null;

    const parentWidth = parentLayout.width;
    if (
      typeof parentWidth !== 'number' ||
      parentWidth === null ||
      parentWidth === 0
    ) {
      return null;
    }

    const padding = this.getParentPadding();
    const margin = parentLayout.margin ?? {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    return Math.max(
      0,
      parentWidth - padding.left - padding.right - margin.left - margin.right,
    );
  }

  /**
   * 获取当前节点可用宽度（减去padding）
   */
  getAvailableWidth(): number {
    if (!this.layout) return 0;

    const width = typeof this.layout.width === 'number' ? this.layout.width : 0;
    const padding = this.layout.padding ?? {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    return Math.max(0, width - padding.left - padding.right);
  }

  /**
   * 计算子节点最大宽度（位置+宽度）
   */
  calculateChildrenMaxWidth(): number {
    if (!this.children?.length) return 0;

    let maxWidth = 0;
    for (const child of this.children) {
      if (!child.layout) continue;
      const childX = child.layout.x ?? 0;
      const childWidth =
        typeof child.layout.width === 'number' ? child.layout.width : 0;
      maxWidth = Math.max(maxWidth, childX + childWidth);
    }

    return maxWidth;
  }

  /**
   * 计算子节点总高度
   * 最后一个子节点的margin.bottom不计入（仅用于元素间距）
   */
  calculateChildrenHeight(): number {
    if (!this.children?.length) return 0;

    const validChildren = this.children.filter((child) => child.layout);
    if (!validChildren.length) return 0;

    let maxBottom = 0;
    for (let i = 0; i < validChildren.length; i++) {
      const child = validChildren[i];
      const layout = child.layout!;
      const childY = layout.y ?? 0;
      const childHeight = typeof layout.height === 'number' ? layout.height : 0;
      const margin = layout.margin ?? {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };

      const isLast = i === validChildren.length - 1;
      maxBottom = Math.max(
        maxBottom,
        childY + childHeight + (isLast ? 0 : margin.bottom),
      );
    }

    return Math.max(0, maxBottom);
  }

  /**
   * 计算并更新节点尺寸
   * @param width - 宽度
   * @param height - 高度
   */
  calculateSize(width?: number | null, height?: number | null): this {
    if (!this.layout) return this;

    if (width !== undefined) this.layout.width = width;
    if (height !== undefined) this.layout.height = height;

    return this;
  }
}
