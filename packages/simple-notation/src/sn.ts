import { DataManager } from '@manager/data-manager';
import { ConfigManager } from '@manager/config-manager';
import { RenderManager } from '@manager/render-manager';
import { SNLayoutBuilder } from '@layout/builder';
import { SNDataType, type SNParserInputType } from '@data/model/input';
import type { SNLayoutConfig } from '@manager/model/layout-config';
import type { SNScoreConfig } from '@manager/model/score-config';
import { SNRendererType } from '@render/model';

/**
 * SimpleNotation 配置选项
 */
export interface SimpleNotationOptions {
  /** 布局配置 */
  layout?: Partial<SNLayoutConfig>;
  /** 乐谱配置 */
  score?: Partial<SNScoreConfig>;
  /** 渲染器类型（默认 SVG） */
  renderer?: SNRendererType;
}

/**
 * SimpleNotation 类 - 简谱渲染的主入口类
 *
 * 新的架构设计：
 * - 数据层：解析原始数据（ABC、Template等）
 * - 配置层：管理布局和乐谱配置
 * - 布局层：构建布局树
 * - 渲染层：渲染布局树到页面
 *
 * @example
 * ```typescript
 * // 方式1：使用节点 ID
 * const sn = new SimpleNotation('container');
 * sn.loadData(abcData, SNDataType.ABC);
 *
 * // 方式2：直接传入 DOM 节点
 * const container = document.getElementById('container');
 * const sn = new SimpleNotation(container);
 * sn.loadData(abcData, SNDataType.ABC);
 *
 * // 方式3：传入配置项
 * const sn = new SimpleNotation('container', {
 *   layout: { ... },
 *   score: { ... },
 *   renderer: SNRendererType.SVG
 * });
 * sn.loadData(abcData, SNDataType.ABC);
 * ```
 */
export class SimpleNotation {
  /** 挂载容器 */
  private container: HTMLElement;

  /** 数据管理器 */
  private dataManager: DataManager;

  /** 配置管理器 */
  private configManager: ConfigManager;

  /** 渲染管理器 */
  private renderManager: RenderManager;

  /** 是否已挂载 */
  private mounted: boolean = false;

  /**
   * 创建 SimpleNotation 实例
   *
   * @param container - 挂载容器，可以是 DOM 元素 ID（字符串）或 HTMLElement 对象
   * @param options - 可选的配置项
   * @throws {Error} 当容器不存在或无效时抛出错误
   */
  constructor(
    container: string | HTMLElement,
    options?: SimpleNotationOptions,
  ) {
    // 解析容器
    this.container = this.resolveContainer(container);

    // 初始化管理器
    this.dataManager = new DataManager();
    this.configManager = new ConfigManager({
      layout: options?.layout,
      score: options?.score,
    });

    // 初始化渲染管理器
    const rendererType = options?.renderer || SNRendererType.SVG;
    this.renderManager = new RenderManager(rendererType);

    // 挂载渲染器
    this.renderManager.init(this.container);
    this.mounted = true;
  }

  /**
   * 解析容器参数
   *
   * @param container - 容器参数（ID 或 HTMLElement）
   * @returns HTMLElement
   */
  private resolveContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container === 'string') {
      const element = document.getElementById(container);
      if (!element) {
        throw new Error(`Container element with id "${container}" not found`);
      }
      return element;
    }

    if (container instanceof HTMLElement) {
      return container;
    }

    throw new Error(
      'Invalid container: must be a string (element id) or HTMLElement',
    );
  }

  /**
   * 加载乐谱数据并渲染
   *
   * 内部流程：
   * 1. 解析数据（DataManager）
   * 2. 构建布局树（SNLayoutBuilder）
   * 3. 渲染布局树（RenderManager）
   *
   * @param data - 乐谱数据（字符串）
   * @param type - 数据类型（默认 ABC）
   */
  loadData(data: SNParserInputType, type: SNDataType = SNDataType.ABC): void {
    if (!this.mounted) {
      throw new Error('SimpleNotation instance is not mounted');
    }
    try {
      // 1. 解析数据
      const parseResult = this.dataManager.processData(data, type);
      const dataTree = parseResult.data;

      // 2. 获取容器尺寸（用于计算页面大小）
      const containerSize = {
        width:
          this.container.clientWidth ||
          this.container.getBoundingClientRect().width,
        height:
          this.container.clientHeight ||
          this.container.getBoundingClientRect().height,
      };

      // 3. 构建布局树
      const layoutBuilder = new SNLayoutBuilder(
        dataTree,
        this.configManager.getLayout(),
        this.configManager.getScore(),
        containerSize,
      );
      const layoutTree = layoutBuilder.getLayoutTree();

      // 4. 渲染布局树
      this.renderManager.render(layoutTree);
    } catch (error) {
      console.error('Failed to load and render data:', error);
      throw error;
    }
  }

  /**
   * 更新配置
   *
   * @param options - 新的配置项
   */
  updateOptions(options: SimpleNotationOptions): void {
    if (options.layout) {
      this.configManager.setLayout(options.layout);
    }
    if (options.score) {
      this.configManager.setScore(options.score);
    }
    if (options.renderer) {
      this.renderManager.switchRenderer(this.container, options.renderer);
    }
  }

  /**
   * 获取布局配置
   *
   * @returns 布局配置对象（只读）
   */
  getLayoutConfig() {
    return this.configManager.getLayoutConfig();
  }

  /**
   * 获取乐谱配置
   *
   * @returns 乐谱配置对象（只读）
   */
  getScoreConfig() {
    return this.configManager.getScoreConfig();
  }

  /**
   * 销毁实例，释放资源
   */
  destroy(): void {
    if (this.renderManager) {
      this.renderManager.destroy();
    }
    this.mounted = false;
  }
}
