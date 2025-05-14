import { SNBorderLayer, SNContent } from '@components';
import { SNConfig } from '@config';
import { SNBoxType, SNData, SNOptions, SNDataType } from '@types';
import { SvgUtils } from '@utils';
import { SNRuntime } from './config/runtime';
import { Logger } from '@utils';

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
 * ```
 */
export class SimpleNotation {
  container: HTMLDivElement;

  /** SVG根节点 */
  el: SVGElement;

  /** 内容渲染组件 */
  content: SNContent | null;

  /**
   * 创建一个新的简谱实例
   *
   * @param container - 用于承载简谱的 DOM 容器元素
   * @param options - 可选的配置项，包括宽度、高度等
   * @throws {Error} 当容器元素为空时抛出错误
   */
  constructor(container: HTMLDivElement, options?: SNOptions) {
    if (!container) throw new Error('container is null');
    this.container = container;
    // 根据 options 中的 debug 字段设置调试模式
    Logger.isDebugMode = options?.debug || false;
    Logger.debug('constructor 实例初始化开始', 'SimpleNotation');
    // 初始化配置项，确保所有配置都有值
    new SNConfig(container, options);
    // 创建svg节点
    this.el = SvgUtils.createSvg(SNConfig.width, SNConfig.height);
    container.appendChild(this.el);
    this.content = null;
    Logger.debug('constructor 实例初始化完成', 'SimpleNotation');
  }

  updateOptions(options: SNOptions) {
    Logger.debug('updateOptions 更新配置项', 'SimpleNotation');
    SNConfig.update(options);
    this.render();
  }

  /**
   * 加载简谱数据并重新渲染
   *
   * @param data - 简谱数据，包含谱面信息和音符数据
   * @param type - 数据类型，默认为模板写法（template），可选abc写法
   * @description
   * 这个方法会完全重新加载数据并重绘整个简谱。它会：
   * 1. 更新运行时配置
   * 2. 清除现有内容
   * 3. 重新创建内容组件
   * 4. 绘制信息区域
   * 5. 绘制谱面内容
   */
  loadData(data: SNData | string, type: SNDataType = SNDataType.TEMPLATE) {
    Logger.debug('loadData 加载数据', 'SimpleNotation');
    if (type === SNDataType.ABC) {
      Logger.warn('ABC解析还在开发，无法使用', 'SimpleNotation');
      new SNRuntime(data, type);
      return;
    }
    new SNRuntime(data, type);
    this.render();
  }

  render() {
    this.setHeight(this.container.clientHeight);
    Logger.debug('render 渲染画布', 'SimpleNotation');
    if (SNBorderLayer?.el) SNBorderLayer.destroyed();
    // 创建边框层
    new SNBorderLayer(this.el);
    if (this.content?.el) this.content.el.remove();
    // 创建内容节点
    this.content = new SNContent(this.el, SNConfig.content);
    this.content.drawInfo(SNRuntime.info);
    this.content.drawScore(SNRuntime.score);
    this.setHeightByContent();
    this.content.resize(
      this.el.clientWidth,
      this.el.clientHeight - (this.content.info?.height || 0),
    );
    this.content.drawBorderBox(
      SNBoxType.CONTENT,
      SNConfig.debug.borderbox?.content,
    );
    this.content.drawScoreBorderBox();
  }

  setHeightByContent() {
    const autoHeight =
      this.content!.el.getBoundingClientRect().height! +
      SNConfig.content.padding * 2;
    Logger.debug(`setHeight 自动设置高度:${autoHeight}`, 'SimpleNotation');
    SNConfig.height = autoHeight;
    this.el.setAttribute('height', String(SNConfig.height));
  }

  setHeight(height: number) {
    Logger.debug(`setHeight 设置高度:${height}`, 'SimpleNotation');
    SNConfig.height = height;
    this.el.setAttribute('height', String(SNConfig.height));
  }

  setWidth(width: number) {
    Logger.debug('setWidth 设置宽度', 'SimpleNotation');
    SNConfig.width = width;
    this.el.setAttribute('width', String(SNConfig.width));
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
    Logger.debug('resize 重新计算尺寸', 'SimpleNotation');
    width || this.setWidth(width!);
    height || this.setHeight(height!);
    this.content?.el.remove();
    this.content = new SNContent(this.el, SNConfig.content);
    this.content.drawInfo(SNRuntime.info);
    this.content.drawScore(SNRuntime.score);
  }
}
