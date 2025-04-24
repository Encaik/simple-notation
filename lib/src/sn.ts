import { SNContent } from '@components';
import { SNConfig } from '@config';
import { SNData, SNOptions } from '@types';
import { SvgUtils } from '@utils';
import { SNRuntime } from './config/runtime';

/* 简谱 */
export class SimpleNotation {
  el: SVGElement; //svg节点
  content: SNContent; //内容

  constructor(container: HTMLDivElement, options?: SNOptions) {
    if (!container) throw new Error('container is null');
    // 初始化配置项，确保所有配置都有值
    new SNConfig(container, options);
    // 创建svg节点
    this.el = SvgUtils.createSvg(SNConfig.width, SNConfig.height);
    container.appendChild(this.el);
    // 创建内容节点
    this.content = new SNContent(this.el, SNConfig.content);
  }

  /**
   * 加载简谱数据并绘制
   * @param data
   */
  loadData(data: SNData) {
    new SNRuntime(data);
    if (data && this.content.el) {
      this.content.el.remove();
      this.content = new SNContent(this.el, SNConfig.content);
    }
    this.content.drawInfo(SNRuntime.info);
    this.content.drawScore(SNRuntime.score);
  }

  resize(width: number, height: number) {
    SNConfig.width = width;
    SNConfig.height = height;
    this.el.setAttribute('width', String(SNConfig.width));
    this.el.setAttribute('height', String(SNConfig.height));
    this.content.el.remove();
    this.content = new SNContent(this.el, SNConfig.content);
    this.content.drawInfo(SNRuntime.info);
    this.content.drawScore(SNRuntime.score);
  }
}
