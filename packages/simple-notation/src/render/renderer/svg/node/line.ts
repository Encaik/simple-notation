import type { SNLayoutNode } from '@layout/node';
import type { SvgRenderer } from '../../svg-renderer';

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
  g.setAttribute('id', `layout-${node.id}`);
  g.setAttribute('data-type', 'line');

  // 设置位置
  g.setAttribute('transform', `translate(${layout.x}, ${layout.y})`);

  // 绘制行背景
  if (layout.height && layout.height > 0) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', layout.width ? String(layout.width) : '100%');
    rect.setAttribute('height', String(layout.height));
    rect.setAttribute('fill', '#fff9e6');
    rect.setAttribute('stroke', '#f5a623');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('stroke-dasharray', '2,2');
    g.appendChild(rect);
  }

  // 添加文本标签
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '5');
  text.setAttribute('y', '13');
  text.setAttribute('font-size', '10');
  text.setAttribute('fill', '#f5a623');
  text.textContent = `LINE (${node.id})`;
  g.appendChild(text);

  // 渲染子节点
  renderer.renderChildren(g, node);

  parent.appendChild(g);
}
