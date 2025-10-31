import { BaseRenderer } from '../base-renderer';
import type { SNLayoutNode } from '@layout/node';

/**
 * DOM/HTML 渲染器
 *
 * 使用 HTML DOM 元素渲染布局树
 */
export class DomRenderer extends BaseRenderer {
  /**
   * 创建 DOM 输出节点
   *
   * @returns DIV 元素
   */
  protected createOutputNode(): HTMLElement {
    const div = document.createElement('div');
    div.style.position = 'relative';
    div.style.width = '100%';
    div.style.height = '100%';
    return div;
  }

  /**
   * 渲染布局树
   *
   * @param layoutTree - 布局树根节点
   */
  render(_layoutTree: SNLayoutNode): void {
    if (!this.outputNode) {
      throw new Error('Renderer not mounted. Call mount() first.');
    }

    // 清空之前的内容
    this.outputNode.innerHTML = '';

    // TODO: 实现 DOM 渲染逻辑
    // 这里先输出一个占位符
    const placeholder = document.createElement('div');
    placeholder.textContent = 'DOM Renderer - Coming Soon';
    placeholder.style.padding = '20px';
    placeholder.style.color = '#666';
    this.outputNode.appendChild(placeholder);
  }
}
