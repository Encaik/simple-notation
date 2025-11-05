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

  // 绘制元素背景（ELEMENT层级：蓝色）
  if (layout.width && typeof layout.width === 'number' && layout.width > 0) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(layout.width));
    rect.setAttribute(
      'height',
      layout.height && typeof layout.height === 'number' && layout.height > 0
        ? String(layout.height)
        : '20',
    );
    rect.setAttribute('fill', '#42a5f5'); // 蓝色半透明背景
    rect.setAttribute('fill-opacity', '0.2');
    rect.setAttribute('stroke', '#42a5f5'); // 蓝色边框
    rect.setAttribute('stroke-width', '1');
    g.appendChild(rect);
  }

  // 渲染子节点
  renderer.renderChildren(g, node);

  parent.appendChild(g);
}
