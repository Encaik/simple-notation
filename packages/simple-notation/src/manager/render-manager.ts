import { IRenderer, SNRendererType } from '@render/model';
import { SvgRenderer } from '@render/renderer/svg';
import type { SNLayoutNode } from '@layout/node';
import type { SNDebugConfig } from '@manager/model/debug-config';

/**
 * 渲染器管理器
 *
 * 负责管理渲染器实例，将渲染节点挂载到页面
 */
export class RenderManager {
  /** 当前使用的渲染器 */
  private renderer: IRenderer | null = null;

  /** 渲染器类型 */
  private rendererType: SNRendererType;

  /**
   * 创建渲染器管理器
   *
   * @param rendererType - 渲染器类型（默认 SVG）
   */
  constructor(rendererType: SNRendererType = SNRendererType.SVG) {
    this.rendererType = rendererType;
  }

  /**
   * 初始化渲染器
   *
   * @param container - 容器元素
   * @param rendererType - 渲染器类型（可选，覆盖构造函数中的类型）
   */
  init(container: HTMLElement, rendererType?: SNRendererType): IRenderer {
    // 如果提供了新的类型，更新类型
    if (rendererType) {
      this.rendererType = rendererType;
    }

    // 如果已有渲染器，先卸载
    if (this.renderer) {
      this.renderer.unmount();
    }

    // 根据类型创建渲染器
    this.renderer = this.createRenderer(this.rendererType);

    // 挂载到容器
    this.renderer.mount(container);

    return this.renderer;
  }

  /**
   * 渲染布局树
   *
   * @param layoutTree - 布局树根节点
   * @param debugConfig - 调试配置（可选）
   */
  render(
    layoutTree: SNLayoutNode,
    debugConfig?: Readonly<SNDebugConfig>,
  ): void {
    if (!this.renderer) {
      throw new Error('Renderer not initialized. Call init() first.');
    }

    this.renderer.render(layoutTree, debugConfig);
  }

  /**
   * 更新渲染（增量更新）
   *
   * @param layoutTree - 布局树根节点
   * @param changes - 变更列表
   */
  update(layoutTree: SNLayoutNode, changes?: unknown[]): void {
    if (!this.renderer) {
      throw new Error('Renderer not initialized. Call init() first.');
    }

    if (this.renderer.update) {
      this.renderer.update(layoutTree, changes);
    } else {
      // 如果没有实现 update，回退到完全重新渲染
      this.renderer.render(layoutTree);
    }
  }

  /**
   * 切换渲染器类型
   *
   * @param container - 容器元素
   * @param rendererType - 新的渲染器类型
   */
  switchRenderer(
    container: HTMLElement,
    rendererType: SNRendererType,
  ): IRenderer {
    return this.init(container, rendererType);
  }

  /**
   * 获取当前渲染器
   *
   * @returns 当前渲染器实例
   */
  getRenderer(): IRenderer | null {
    return this.renderer;
  }

  /**
   * 获取输出节点
   *
   * @returns 可以直接挂载到页面的节点
   */
  getOutputNode(): HTMLElement | HTMLCanvasElement | SVGElement | null {
    return this.renderer?.getOutputNode() || null;
  }

  /**
   * 销毁渲染器管理器
   */
  destroy(): void {
    if (this.renderer) {
      this.renderer.unmount();
      this.renderer = null;
    }
  }

  /**
   * 创建渲染器实例
   *
   * @param type - 渲染器类型
   * @returns 渲染器实例
   */
  private createRenderer(type: SNRendererType): IRenderer {
    switch (type) {
      case SNRendererType.SVG:
        return new SvgRenderer();
      // case SNRendererType.DOM:
      //   return new DomRenderer();
      // case SNRendererType.CANVAS:
      //   return new CanvasRenderer();
      default:
        throw new Error(`Unknown renderer type: ${type}`);
    }
  }
}
