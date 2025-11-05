import type { SNLayoutNode } from '@layout/node';
import type { SvgRenderer } from '../svg-renderer';
import { DebugConfigInstance } from '@manager/config';

/**
 * 渲染 LINE 节点
 *
 * @param parent - 父 SVG 元素
 * @param node - LINE 布局节点
 * @param renderer - SVG 渲染器实例
 */
export function renderLine(
  parent: SVGElement,
  node: SNLayoutNode,
  renderer: SvgRenderer,
): void {
  const layout = node.layout;
  if (!layout) return;

  // 创建行容器组
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', node.id);
  g.setAttribute('layouttype', 'line');
  // 设置数据层类型（如果有对应的数据节点）
  if (node.data?.type) {
    g.setAttribute('datatype', node.data.type);
  }

  // 设置位置
  g.setAttribute('transform', `translate(${layout.x}, ${layout.y})`);

  // 绘制行背景（用于调试）
  let width: number;
  if (layout.width && typeof layout.width === 'number' && layout.width > 0) {
    width = layout.width;
  } else if (node.parent?.layout) {
    // 从父节点计算可用宽度（默认撑满父级）
    const parentLayout = node.parent.layout;
    const parentWidth =
      typeof parentLayout.width === 'number' ? parentLayout.width : 0;
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

  const height =
    layout.height && typeof layout.height === 'number' && layout.height > 0
      ? layout.height
      : 50; // 默认高度

  // 背景框（调试开关）
  if (DebugConfigInstance.isLayerBackgroundEnabled('line')) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('fill', '#66bb6a');
    rect.setAttribute('fill-opacity', '0.12');
    rect.setAttribute('stroke', '#66bb6a');
    rect.setAttribute('stroke-width', '1');
    g.appendChild(rect);
  }

  // 五线谱应按小节存在与否绘制，因此放在 measure 元素内按需渲染

  // 渲染子节点
  renderer.renderChildren(g, node);

  parent.appendChild(g);
}
