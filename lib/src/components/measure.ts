import { SNBox } from '@core';
import { SNMeasureOptions, SNNoteOptions } from '@types';
import { SNNote } from './note';
import { SNStave } from './stave';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';

/* 小节 */
export class SNMeasure extends SNBox {
  el: SVGGElement;
  index: number; // 当前是第几个小节
  measureData: string; // 当前小节的原始数据
  weight: number;
  noteOptions: SNNoteOptions[];
  notes: SNNote[] = [];
  x: number; // 当前小节的x轴坐标
  width: number; // 当前小节的宽度

  constructor(stave: SNStave, options: SNMeasureOptions) {
    super(options.x, stave.innerY, options.width, stave.innerHeight, [5, 0]);
    this.index = options.index;
    this.measureData = options.measureData;
    this.weight = options.weight;
    this.noteOptions = options.noteOptions;
    this.x = options.x;
    this.width = options.width;
    this.el = SvgUtils.createG({
      tag: `measure-${this.index}`,
    });
    stave.el.appendChild(this.el);
    this.drawBorderBox(this.el, SNConfig.debug.borderbox?.measure);
    this.draw();
  }

  drawCount() {
    this.el.appendChild(
      SvgUtils.createText({
        text: `${this.index}`,
        x: this.x,
        y: this.y + 2,
        fontSize: 10,
        fontFamily: 'sans-serif',
        textAnchor: 'middle',
      }),
    );
  }

  draw() {
    this.drawCount();
    const unitWidth = this.innerWidth / this.weight;
    let totalX = this.innerX;
    this.noteOptions.forEach((option) => {
      option.x = totalX;
      option.width = unitWidth * option.weight;
      const note = new SNNote(this, option);
      this.notes.push(note);
      totalX += option.width;
    });
  }
}
