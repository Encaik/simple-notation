import { SNBox } from '@core';
import { SNMeasure } from './measure';
import { SNStaveOptions } from '@types';
import { SNScore } from './score';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';

/* 乐句 */
export class SNStave extends SNBox {
  el: SVGGElement;
  measureData: string[]; //乐句数据
  measures: SNMeasure[] = []; //小节
  index: number; //当前是第几行
  totalMeasures: number; //当前乐句前乐谱总小节数
  totalNotes: number; //当前乐句前乐谱总音符数
  staveNotes: number = 0; //乐句总音符数

  constructor(score: SNScore, options: SNStaveOptions) {
    super(
      score.innerX,
      options.y,
      score.innerWidth,
      SNConfig.score.lineHeight + SNConfig.score.lyricHeight,
      [10, 0],
    );
    this.index = options.index;
    this.totalMeasures = score.totalMeasures;
    this.totalNotes = score.totalNotes;
    this.measureData = options.context.trim().split('|');
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
    const unitWidth = this.innerWidth / this.measureData.length;
    this.measureData.forEach((data, idx) => {
      const measure = new SNMeasure(this, {
        context: data,
        index: idx,
        currentMeasure: this.totalMeasures + idx,
        x: this.innerX + idx * unitWidth,
        width: unitWidth,
      });
      this.measures.push(measure);
      this.totalNotes += measure.notes.length;
      this.drawMeasureLine(measure);
    });
    this.drawMeasureEndLine();
  }
}
