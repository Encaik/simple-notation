import type { SNLayoutNode } from '@layout/node';
import type { SvgRenderer } from '../../svg-renderer';

/**
 * 渲染 ELEMENT 节点
 *
 * @param parent - 父 SVG 元素
 * @param node - ELEMENT 布局节点
 * @param renderer - SVG 渲染器实例
 */
export function renderElement(
  parent: SVGElement,
  node: SNLayoutNode,
  renderer: SvgRenderer,
): void {
  const layout = node.layout;
  if (!layout) return;

  // 创建元素容器组
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', `layout-${node.id}`);
  g.setAttribute('data-type', 'element');

  // 设置位置
  g.setAttribute('transform', `translate(${layout.x}, ${layout.y})`);

  // 绘制元素背景
  if (layout.width && layout.width > 0) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(layout.width));
    rect.setAttribute(
      'height',
      layout.height && layout.height > 0 ? String(layout.height) : '20',
    );
    rect.setAttribute('fill', '#f0f0f0');
    rect.setAttribute('stroke', '#999999');
    rect.setAttribute('stroke-width', '0.5');
    g.appendChild(rect);
  }

  // 添加文本标签（显示关联的数据类型）
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '2');
  text.setAttribute('y', '10');
  text.setAttribute('font-size', '9');
  text.setAttribute('fill', '#666666');
  const dataType = node.data?.type || 'unknown';
  text.textContent = `${dataType}`;
  g.appendChild(text);

  // 渲染子节点
  renderer.renderChildren(g, node);

  parent.appendChild(g);
}
