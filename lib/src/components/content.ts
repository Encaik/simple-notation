import { SNBox } from '@core';
import { SNInfo } from './info';
import {
  SNInfoOptions,
  SNContentOptions,
  SNScoreOptions,
  SNDataInfo,
  SNBoxType,
} from '@types';
import { SNScore } from './score';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';

/**
 * SNContent 类 - 简谱内容的容器组件
 *
 * @class SNContent
 * @extends {SNBox}
 * @description
 * 这个类是简谱渲染的主要容器组件，负责管理和协调信息区域和谱面区域的渲染。
 * 它继承自 SNBox，具有基本的布局和边界框功能。
 */
export class SNContent extends SNBox {
  /** SVG group 元素，作为内容的容器 */
  el: SVGGElement;

  /** 信息区域组件实例 */
  info: SNInfo | undefined;

  /** 谱面区域组件实例 */
  score: SNScore | undefined;

  /**
   * 创建一个新的内容容器实例
   *
   * @param svg - 父级 SVG 元素
   * @param options - 内容区域的配置选项
   * @description
   * 构造函数会：
   * 1. 初始化容器的尺寸和内边距
   * 2. 创建 SVG group 元素
   * 3. 绘制调试边界框（如果启用）
   * 4. 初始化信息和谱面区域
   */
  constructor(svg: SVGElement, options: SNContentOptions) {
    super(
      null,
      SNBoxType.CONTENT,
      0,
      0,
      svg.clientWidth,
      svg.clientHeight,
      options.padding,
    );
    this.el = SvgUtils.createG({
      tag: 'content',
    });
    svg.appendChild(this.el);
    this.drawBorderBox(this.el, SNConfig.debug.borderbox?.content);
    this.initInfo(SNConfig.info);
    this.initScore(SNConfig.score);
  }

  /**
   * 初始化信息区域组件
   *
   * @param options - 信息区域的配置选项
   * @description
   * 创建一个新的信息区域组件实例，用于显示标题、作者等元数据
   */
  initInfo(options: SNInfoOptions) {
    this.info = new SNInfo(this, options);
  }

  /**
   * 绘制信息区域内容
   *
   * @param options - 要显示的信息数据
   * @description
   * 使用提供的数据更新信息区域的显示内容
   */
  drawInfo(options: SNDataInfo) {
    this.info?.draw(options);
  }

  /**
   * 初始化谱面区域组件
   *
   * @param options - 谱面区域的配置选项
   * @description
   * 创建一个新的谱面区域组件实例，用于显示音符和小节线
   */
  initScore(options: SNScoreOptions) {
    this.score = new SNScore(this, options);
  }

  /**
   * 绘制谱面内容
   *
   * @param scoreData - 谱面数据字符串
   * @description
   * 使用提供的谱面数据更新谱面区域的显示内容
   */
  drawScore(scoreData: string) {
    this.score?.draw(scoreData);
  }
}
