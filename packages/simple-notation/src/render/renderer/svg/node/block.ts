import type { SNLayoutNode } from '@layout/node';
import { SNLayoutNodeType } from '@layout/model';
import type { SvgRenderer } from '../svg-renderer';

/**
 * 渲染 BLOCK 节点
 *
 * @param parent - 父 SVG 元素
 * @param node - BLOCK 布局节点
 * @param renderer - SVG 渲染器实例
 */
export function renderBlock(
  parent: SVGElement,
  node: SNLayoutNode,
  renderer: SvgRenderer,
): void {
  const layout = node.layout;
  if (!layout) return;

  // 创建块容器组
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', `layout-${node.id}`);
  g.setAttribute('data-type', 'block');

  // 设置位置
  g.setAttribute('transform', `translate(${layout.x}, ${layout.y})`);

  // 先渲染子节点，以便获取实际边界
  renderer.renderChildren(g, node);

  // 计算宽度：使用布局计算的值或从父节点计算
  let width: number;
  if (layout.width && typeof layout.width === 'number' && layout.width > 0) {
    width = layout.width;
  } else if (node.parent?.layout) {
    // 从父节点计算可用宽度（默认撑满父级）
    const parentLayout = node.parent.layout;
    let parentWidth =
      typeof parentLayout.width === 'number' ? parentLayout.width : 0;

    // 如果父节点宽度为 0（可能是 Root 节点自适应），尝试从 SVG 容器获取实际宽度
    if (parentWidth === 0 && node.parent.type === SNLayoutNodeType.ROOT) {
      // 尝试从 SVG 根元素获取实际宽度
      const svgElement = parent.closest('svg');
      if (svgElement) {
        const svgWidth =
          svgElement.clientWidth || svgElement.getBoundingClientRect().width;
        if (svgWidth > 0) {
          // 计算减去 Root 节点的 margin 后的宽度
          const rootMargin = node.parent.layout.margin || {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          };
          parentWidth = svgWidth - rootMargin.left - rootMargin.right;
        }
      }
    }

    const parentPadding = node.parent.layout.padding || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
    const parentMargin = node.parent.layout.margin || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
    width =
      parentWidth -
      parentPadding.left -
      parentPadding.right -
      parentMargin.left -
      parentMargin.right;
    width = Math.max(0, width);
  } else {
    // 最后的后备方案：使用默认宽度
    width = 100;
  }

  // 计算高度：优先使用布局计算的值，如果为 0 或无效，则根据子节点的实际边界重新计算
  let height: number;
  if (layout.height && typeof layout.height === 'number' && layout.height > 0) {
    height = layout.height;
  } else {
    // 根据子节点的实际位置和高度重新计算
    const padding = layout.padding || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    // 计算子节点的最大底部边界
    let maxBottom = 0;
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (!child.layout) continue;

        const childY = typeof child.layout.y === 'number' ? child.layout.y : 0;
        const childHeight =
          typeof child.layout.height === 'number' ? child.layout.height : 0;
        const childMargin = child.layout.margin || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };

        // 计算子节点的底部边界（Y + height + margin.bottom）
        const childBottom = childY + childHeight + childMargin.bottom;
        maxBottom = Math.max(maxBottom, childBottom);
      }

      // 高度 = 最大底部边界 - padding.top（第一个子节点从 padding.top 开始）+ padding.bottom
      height = Math.max(0, maxBottom - padding.top) + padding.bottom;
    } else {
      // 没有子节点，使用默认高度
      height = 50;
    }

    // 如果计算出的高度仍然为 0 或无效，使用默认值
    if (height <= 0) {
      height = 50;
    }
  }

  // 绘制块背景（BLOCK层级：黄色）
  // 使用计算出的宽度和高度
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', String(width));
  rect.setAttribute('height', String(height));
  rect.setAttribute('fill', '#ffd54f'); // 黄色半透明背景
  rect.setAttribute('fill-opacity', '0.2');
  rect.setAttribute('stroke', '#ffd54f'); // 黄色边框
  rect.setAttribute('stroke-width', '1.5');
  // 将背景框插入到最前面，这样子节点会显示在上面
  g.insertBefore(rect, g.firstChild);

  parent.appendChild(g);
}
