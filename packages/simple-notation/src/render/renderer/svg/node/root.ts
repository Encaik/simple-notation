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

  // 绘制背景（如果有）
  if (layout.width && layout.height) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(layout.width));
    rect.setAttribute('height', String(layout.height));
    rect.setAttribute('fill', '#f5f5f5');
    rect.setAttribute('stroke', '#cccccc');
    rect.setAttribute('stroke-width', '1');
    g.appendChild(rect);
  }

  // 添加文本标签（用于调试）
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '10');
  text.setAttribute('y', '20');
  text.setAttribute('font-size', '14');
  text.setAttribute('fill', '#666666');
  text.textContent = `ROOT (${node.id})`;
  g.appendChild(text);

  // 渲染子节点
  renderer.renderChildren(g, node);

  parent.appendChild(g);
}
