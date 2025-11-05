import type { SNLayoutNode } from '@layout/node';
import type { SvgRenderer } from '../../svg-renderer';

/**
 * 渲染 ROOT 节点
 *
 * @param parent - 父 SVG 元素
 * @param node - ROOT 布局节点
 * @param renderer - SVG 渲染器实例
 */
export function renderRoot(
  parent: SVGElement,
  node: SNLayoutNode,
  renderer: SvgRenderer,
): void {
  const layout = node.layout;
  if (!layout) return;

  // 创建根容器组
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', `layout-${node.id}`);
  g.setAttribute('data-type', 'root');

  // 设置位置和尺寸
  g.setAttribute('transform', `translate(${layout.x}, ${layout.y})`);

  // 绘制背景（ROOT层级：红色）
  if (layout.width && layout.height) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(layout.width));
    rect.setAttribute('height', String(layout.height));
    rect.setAttribute('fill', '#ff6b6b'); // 红色半透明背景
    rect.setAttribute('fill-opacity', '0.2');
    rect.setAttribute('stroke', '#ff6b6b'); // 红色边框
    rect.setAttribute('stroke-width', '2');
    g.appendChild(rect);
  }

  // 渲染子节点
  renderer.renderChildren(g, node);

  parent.appendChild(g);
}
