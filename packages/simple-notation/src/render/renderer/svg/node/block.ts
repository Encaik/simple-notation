import type { SNLayoutNode } from '@layout/node';
import type { SvgRenderer } from '../../svg-renderer';

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

  // 绘制块背景（如果定义了宽度和高度）
  if (layout.width && layout.height && layout.width > 0 && layout.height > 0) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(layout.width));
    rect.setAttribute('height', String(layout.height));
    rect.setAttribute('fill', '#e8f4f8');
    rect.setAttribute('stroke', '#4a90e2');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('stroke-dasharray', '3,3');
    g.appendChild(rect);
  }

  // 添加文本标签
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '5');
  text.setAttribute('y', '15');
  text.setAttribute('font-size', '11');
  text.setAttribute('fill', '#4a90e2');
  text.textContent = `BLOCK (${node.id})`;
  g.appendChild(text);

  // 渲染子节点
  renderer.renderChildren(g, node);

  parent.appendChild(g);
}
