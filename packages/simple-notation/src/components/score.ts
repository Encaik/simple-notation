import { SNBox } from '@core';
import { SNContent } from './content';
import { SNBoxType, SNScoreOptions, SNStaveOptions, SNStaveType } from '@types';
import { Logger, SvgUtils } from '@utils';
import { SNConfig } from '@config';
import { SNStave } from './stave';
import { SNRuntime } from '../config/runtime';
import {
  SNBeamLayer,
  SNChordLayer,
  SNPointerLayer,
  SNTieLineLayer,
} from '@layers';

/**
 * SNScore 类 - 简谱谱面渲染组件
 *
 * @class SNScore
 * @extends {SNBox}
 * @description
 * 这个类负责解析和渲染简谱的谱面内容，包括音符、小节线、
 * 连音线等。它会自动处理分行和布局，确保谱面美观易读。
 */
export class SNScore extends SNBox {
  /** SVG group 元素，作为谱面的容器 */
  el: SVGGElement;

  /** 五线谱选项数组，用于存储每行谱表的配置 */
  staveOptions: SNStaveOptions[] = [];

  /** 五线谱实例数组，存储已渲染的谱表 */
  staves: SNStave[] = [];

  /** 当前处理的音符总数 */
  noteCount: number = 0;

  /**
   * 创建一个新的谱面实例
   *
   * @param content - 父级内容容器组件
   * @param options - 谱面的配置选项
   * @description
   * 构造函数会：
   * 1. 计算并设置谱面区域的位置和大小
   * 2. 创建 SVG group 元素
   * 3. 绘制调试边界框（如果启用）
   */
  constructor(content: SNContent, options: SNScoreOptions) {
    super(
      content,
      SNBoxType.SCORE,
      content.innerX,
      content.innerY + (content.info?.height || 0),
      content.innerWidth,
      content.innerHeight - (content.info?.height || 0),
      options.padding,
    );
    this.el = SvgUtils.createG({
      tag: 'score',
    });
    new SNTieLineLayer(this.el);
    new SNPointerLayer(this.el);
    new SNChordLayer(this.el);
    new SNBeamLayer(this.el);
    content.el.appendChild(this.el);
  }

  /**
   * 绘制完整的谱面
   *
   * @param scoreData - 谱面的原始字符串数据
   * @description
   * 完整的谱面渲染流程：
   * 1. 解析谱面数据
   * 2. 计算每个谱表的位置
   * 3. 创建并渲染所有谱表
   * 4. 处理歌词显示（如果有）
   */
  draw() {
    this.staveOptions = SNRuntime.parsedScore;
    if (!this.staveOptions?.length) {
      Logger.warn('没有找到谱面数据,请确认已经使用loadData加载数据', 'SNScore');
      return;
    }
    let totalY = this.innerY;
    const pageSize = 870;
    let currentPageSize = 0;
    this.staveOptions.forEach((option, idx) => {
      if (option.type !== SNStaveType.DefaultLine) return;
      option.index = idx + 1;
      option.y = totalY;
      option.endLine = option.index === this.staveOptions.length;
      const stave = new SNStave(this, option);
      this.staves.push(stave);
      totalY +=
        SNConfig.score.chordHeight +
        SNConfig.score.lineHeight +
        (SNConfig.score.showChordLine ? SNConfig.score.chordLineHeight : 0) +
        SNConfig.score.lineSpace +
        (SNRuntime.lyric ? SNConfig.score.lyricHeight : 0);
      // 分页处理, totalY对A4高度取余
      if (totalY % pageSize >= currentPageSize) {
        currentPageSize = totalY % pageSize;
      } else {
        currentPageSize = totalY % pageSize;
        const breakLine = SvgUtils.createLine({
          x1: this.innerX,
          y1: totalY - SNConfig.score.lineSpace,
          x2: this.innerX + this.innerWidth,
          y2: totalY - SNConfig.score.lineSpace,
          stroke: 'transparent',
        });
        breakLine.setAttribute('sn-tag', 'break-line');
        breakLine.setAttribute(
          'style',
          'page-break-after: always;break-after: always;',
        );
        this.el.appendChild(breakLine);
      }
    });
    this.setHeight(totalY - this.innerY + SNConfig.score.lineSpace);
    SNBeamLayer.draw(this.staves.flatMap((stave) => stave.measures));
    this.drawBorderBox(SNBoxType.SCORE, SNConfig.debug.borderbox?.score);
  }
}
