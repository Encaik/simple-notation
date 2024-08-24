import { SNBox } from '@core';
import { SNMeasure } from './measure';
import { SNMeasureOptions, SNStaveOptions } from '@types';
import { SNScore } from './score';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';

/* 乐句 */
export class SNStave extends SNBox {
  el: SVGGElement;
  index: number; // 当前是第几个乐句
  weight: number; // 乐句总权重
  measureOptions: SNMeasureOptions[] = []; // 当前乐句每个小节的配置
  measures: SNMeasure[] = []; // 当前乐句每个小节
  y: number; // 当前乐句的y轴坐标

  constructor(score: SNScore, options: SNStaveOptions) {
    super(
      score.innerX,
      options.y,
      score.innerWidth,
      SNConfig.score.lineHeight + SNConfig.score.lyricHeight,
      [10, 0],
    );
    this.index = options.index;
    this.weight = options.weight;
    this.measureOptions = options.measureOptions;
    this.y = options.y;
    this.el = SvgUtils.createG({
      tag: `stave-${this.index}`,
    });
    score.el.appendChild(this.el);
    this.drawBorderBox(this.el, SNConfig.debug.borderbox?.stave);
    this.draw();
  }

  drawMeasureEndLine() {
    this.el.appendChild(
      SvgUtils.createLine({
        x1: this.innerX + this.innerWidth,
        y1: this.innerY + 10,
        x2: this.innerX + this.innerWidth,
        y2: this.innerY + SNConfig.score.lineHeight,
      }),
    );
  }

  drawMeasureLine(measure: SNMeasure) {
    this.el.appendChild(
      SvgUtils.createLine({
        x1: measure.x,
        y1: measure.y + 10,
        x2: measure.x,
        y2: measure.y + SNConfig.score.lineHeight,
      }),
    );
  }

  draw() {
    const unitWidth = this.innerWidth / this.weight;
    let totalX = this.innerX;
    this.measureOptions.forEach((option) => {
      option.x = totalX;
      option.width = unitWidth * option.weight;
      const measure = new SNMeasure(this, option);
      this.measures.push(measure);
      this.drawMeasureLine(measure);
      totalX += option.width;
    });
    this.drawMeasureEndLine();
  }
}
