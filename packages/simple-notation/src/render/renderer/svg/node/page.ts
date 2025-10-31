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
  g.setAttribute('id', `layout-${node.id}`);
  g.setAttribute('data-type', 'page');

  // 设置位置
  g.setAttribute('transform', `translate(${layout.x}, ${layout.y})`);

  // 绘制页面背景
  if (layout.width && layout.height) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(layout.width));
    rect.setAttribute('height', String(layout.height));
    rect.setAttribute('fill', '#ffffff');
    rect.setAttribute('stroke', '#000000');
    rect.setAttribute('stroke-width', '2');
    g.appendChild(rect);
  }

  // 添加文本标签
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '10');
  text.setAttribute('y', '20');
  text.setAttribute('font-size', '12');
  text.setAttribute('fill', '#333333');
  text.textContent = `PAGE (${node.id})`;
  g.appendChild(text);

  // 渲染子节点
  renderer.renderChildren(g, node);

  parent.appendChild(g);
}
