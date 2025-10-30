import { SNContent } from '@components';
import { SNConfig } from '@config';
import { SNOptions, SNBoxType } from '@types';
import { SvgUtils } from '@utils';
import { SNRuntime } from '@config';
import { Logger } from '@utils';
import { SNBox, SNEvent } from '@core';
import { DataManager } from './manager/data-manager.ts';
import { SNDataType, SNParserInputType } from '@data/model';
import { SNBorderLayer } from '@layers';

type EventCallback = (event: CustomEvent) => void;

/**
 * SimpleNotation 类 - 简谱渲染的主类
 *
 * @class SimpleNotation
 * @description
 * 这个类负责创建和管理简谱的渲染。它处理SVG元素的创建、
 * 数据的加载和渲染、以及视图的大小调整等核心功能。
 *
 * @example
 * ```typescript
 * const container = document.querySelector('#container');
 * const sn = new SimpleNotation(container, {
 *   width: 800,
 *   height: 600
 * });
 *
 * // 订阅音符点击事件
 * sn.on('note:click', (event) => {
 *   console.log('点击了音符:', event.detail.noteTag);
 * });
 * ```
 */
export class SimpleNotation extends SNBox {
  container: HTMLDivElement;

  /** SVG根节点 */
  el: SVGElement;

  /** 内容渲染组件 */
  content: SNContent | null;

  /** ResizeObserver实例 */
  private resizeObserver?: ResizeObserver;

  /** 事件系统实例实例 */
  private eventSystem: SNEvent;

  /** 数据管理器实例 */
  private dataManager: DataManager;

  /**
   * 创建一个新的简谱实例
   *
   * @param container - 用于承载简谱的 DOM 容器元素
   * @param options - 可选的配置项，包括宽度、高度等
   * @throws {Error} 当容器元素为空时抛出错误
   */
  constructor(container: HTMLDivElement, options?: SNOptions) {
    if (!container) throw new Error('container is null');
    // 根据 options 中的 debug 字段设置调试模式
    Logger.isDebugMode = options?.debug || false;
    Logger.debug('constructor 实例初始化开始', 'SimpleNotation');
    // 初始化配置项，确保所有配置都有值
    new SNConfig(container, options);
    super(null, SNBoxType.ROOT, 0, 0, SNConfig.width, SNConfig.height, 0);
    this.container = container;
    // 创建svg节点
    this.el = SvgUtils.createSvg(this.width, this.height);
    container.appendChild(this.el);
    this.content = null;
    // 初始化事件实例
    this.eventSystem = new SNEvent();
    // 初始化数据管理器实例
    this.dataManager = new DataManager();
    // 自动resize监听
    if (options?.resize) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this.container) {
            this.resize(entry.contentRect.width);
          }
        }
      });
      this.resizeObserver.observe(this.container);
    }
    Logger.debug('constructor 实例初始化完成', 'SimpleNotation');
  }

  /** 提供实例事件总线，供子组件类型安全地使用 */
  getEventBus(): SNEvent {
    return this.eventSystem;
  }

  /**
   * 订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   * @returns {SimpleNotation} 返回this以支持链式调用
   */
  on(event: string, callback: EventCallback): SimpleNotation {
    this.eventSystem.on(event, callback);
    return this;
  }

  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   * @returns {SimpleNotation} 返回this以支持链式调用
   */
  off(event: string, callback: EventCallback): SimpleNotation {
    this.eventSystem.off(event, callback);
    return this;
  }

  /**
   * 销毁SimpleNotation实例，释放资源
   */
  destroy() {
    if (this.resizeObserver && this.container) {
      this.resizeObserver.unobserve(this.container);
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    this.el.remove();
    this.content = null;
    // 销毁事件系统（实例作用域）
    this.eventSystem.destroy();
  }

  /**
   * 更新配置项并重新渲染
   *
   * @param options - 新的配置项
   * @description
   * 这个方法会更新配置项并重新绘制简谱。它会：
   * 1. 更新运行时配置
   * 2. 重新创建内容组件
   * 3. 绘制信息区域
   * 4. 绘制谱面内容
   */
  updateOptions(options: SNOptions) {
    Logger.debug('updateOptions 更新配置项', 'SimpleNotation');
    SNConfig.update(options);
    if ('resize' in options) {
      if (this.resizeObserver && this.container) {
        this.resizeObserver.unobserve(this.container);
        this.resizeObserver.disconnect();
        this.resizeObserver = undefined;
      }
      if (options.resize) {
        this.resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.target === this.container) {
              this.resize(entry.contentRect.width);
            }
          }
        });
        this.resizeObserver.observe(this.container);
      }
    }
    this.render();
  }

  resetOptions(options?: SNOptions) {
    SNConfig.reset(options);
    this.render();
  }

  /**
   * 加载简谱数据并重新渲染
   *
   * @param data - 简谱数据，包含谱面信息和音符数据
   * @param type - 数据类型，默认为模板写法（template），可选abc写法
   */
  loadData(data: SNParserInputType, type: SNDataType = SNDataType.ABC) {
    const parserResult = this.dataManager.processData(data, type);
    console.log('parserResult', parserResult);

    // 未渲染时不知道整体高度，先撑满容器
    // this.setHeight(this.container.clientHeight);
    // this.render();
  }

  render() {
    Logger.debug('render 渲染画布', 'SimpleNotation');
    if (SNBorderLayer?.el) SNBorderLayer.destroyed();
    // 创建边框层
    new SNBorderLayer(this.el);
    if (this.content?.el) this.content.destroyed();
    // 创建内容节点（将事件总线传递下去以便图层可用）
    this.content = new SNContent(this, SNConfig.content);
    this.setHeight(this.content.height, false);
    this.el.setAttribute('height', `${this.height}`);
  }

  /**
   * 调整简谱视图的大小
   *
   * @param width - 新的宽度（像素）
   * @param height - 新的高度（像素）
   * @description
   * 这个方法会重新设置简谱的显示大小并重绘内容。它会：
   * 1. 更新配置中的尺寸
   * 2. 更新 SVG 元素的尺寸
   * 3. 重新创建并绘制内容
   */
  resize(width?: number, height?: number) {
    Logger.debug(
      `resize 重新设置尺寸，传入宽度：${width}，传入高度：${height}`,
      'SimpleNotation',
    );
    if (width !== undefined) {
      this.setWidth(width!);
      this.el.setAttribute('width', `${this.width}`);
    }
    if (height !== undefined) {
      this.setHeight(height!);
      this.el.setAttribute('height', `${this.height}`);
    }
    this.render();
  }

  /**
   * 获取解析后的乐谱结构
   * @returns {SNStaveOptions[]}
   */
  getParsedScore() {
    return SNRuntime.parsedScore;
  }
}
