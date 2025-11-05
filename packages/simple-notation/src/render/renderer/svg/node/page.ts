import type { SNLayoutNode } from '@layout/node';
import type { SvgRenderer } from '../../svg-renderer';

/**
 * 渲染 PAGE 节点
 *
 * @param parent - 父 SVG 元素
 * @param node - PAGE 布局节点
 * @param renderer - SVG 渲染器实例
 */
export function renderPage(
  parent: SVGElement,
  node: SNLayoutNode,
  renderer: SvgRenderer,
): void {
  const layout = node.layout;
  if (!layout) return;

  // 创建页面容器组
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', node.id);
  g.setAttribute('layouttype', 'page');
  // 设置数据层类型（如果有对应的数据节点）
  if (node.data?.type) {
    g.setAttribute('datatype', node.data.type);
  }

  // 设置位置
  g.setAttribute('transform', `translate(${layout.x}, ${layout.y})`);

  // 绘制页面背景（PAGE层级：橙色）
  if (layout.width && layout.height) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(layout.width));
    rect.setAttribute('height', String(layout.height));
    rect.setAttribute('fill', '#ffa726'); // 橙色半透明背景
    rect.setAttribute('fill-opacity', '0.2');
    rect.setAttribute('stroke', '#ffa726'); // 橙色边框
    rect.setAttribute('stroke-width', '2');
    g.appendChild(rect);
  }

  // 渲染子节点
  renderer.renderChildren(g, node);

  parent.appendChild(g);
}
