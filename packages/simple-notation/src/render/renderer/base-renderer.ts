import type { IRenderer } from '../model';
import type { SNLayoutNode } from '@layout/node';

/**
 * 渲染器基类
 *
 * 提供所有渲染器的通用功能
 */
export abstract class BaseRenderer implements IRenderer {
  /** 容器元素 */
  protected container: HTMLElement | null = null;

  /** 输出节点（可以直接挂载到页面的节点） */
  protected outputNode: HTMLElement | HTMLCanvasElement | SVGElement | null =
    null;

  /**
   * 挂载到容器
   *
   * @param container - 容器元素
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.outputNode = this.createOutputNode();
    if (this.outputNode) {
      container.appendChild(this.outputNode);
    }
  }

  /**
   * 渲染布局树（由子类实现具体渲染逻辑）
   *
   * @param layoutTree - 布局树根节点
   */
  abstract render(layoutTree: SNLayoutNode): void;

  /**
   * 更新渲染（可选，默认重新渲染）
   *
   * @param layoutTree - 布局树根节点
   * @param changes - 变更列表
   */
  update(layoutTree: SNLayoutNode, _changes?: unknown[]): void {
    // 默认实现：完全重新渲染
    this.render(layoutTree);
  }

  /**
   * 卸载渲染器
   */
  unmount(): void {
    if (this.outputNode && this.container) {
      this.container.removeChild(this.outputNode);
    }
    this.outputNode = null;
    this.container = null;
  }

  /**
   * 获取渲染输出节点
   *
   * @returns 可以直接挂载到页面的节点
   */
  getOutputNode(): HTMLElement | HTMLCanvasElement | SVGElement | null {
    return this.outputNode;
  }

  /**
   * 创建输出节点（由子类实现）
   *
   * @returns 输出节点
   */
  protected abstract createOutputNode():
    | HTMLElement
    | HTMLCanvasElement
    | SVGElement;
}
