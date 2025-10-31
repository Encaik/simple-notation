/**
 * 渲染层类型定义
 *
 * 定义渲染器接口和通用类型
 */

import type { SNLayoutNode } from '@layout/node';

/**
 * 渲染器接口
 *
 * 所有渲染器都必须实现此接口
 */
export interface IRenderer {
  /**
   * 挂载到容器
   *
   * @param container - 容器元素（HTMLElement）
   */
  mount(container: HTMLElement): void;

  /**
   * 渲染布局树
   *
   * @param layoutTree - 布局树根节点
   */
  render(layoutTree: SNLayoutNode): void;

  /**
   * 更新渲染（增量更新）
   *
   * @param layoutTree - 布局树根节点
   * @param changes - 变更列表（可选，用于增量更新）
   */
  update?(layoutTree: SNLayoutNode, changes?: unknown[]): void;

  /**
   * 卸载渲染器
   */
  unmount(): void;

  /**
   * 获取渲染输出节点
   *
   * @returns 可以直接挂载到页面的节点
   */
  getOutputNode(): HTMLElement | HTMLCanvasElement | SVGElement | null;
}

/**
 * 渲染器类型
 */
export enum SNRendererType {
  /** DOM/HTML 渲染器 */
  DOM = 'dom',
  /** Canvas 渲染器 */
  CANVAS = 'canvas',
  /** SVG 渲染器 */
  SVG = 'svg',
}

/**
 * 渲染选项
 */
export interface SNRenderOptions {
  /** 渲染器类型 */
  type: SNRendererType;
  /** 其他选项（可选） */
  [key: string]: unknown;
}
