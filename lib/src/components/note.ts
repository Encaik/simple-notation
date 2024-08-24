import { SNBox } from '@core';
import { SNMeasure } from './measure';
import { SNNoteOptions } from '@types';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';
import { SNRuntime } from '../config/runtime';

/* 乐句 */
/**
 * 1 四分音符
 * 1/8 八分音符
 * 1/16 十六分音符
 * 1/32 三十二分音符
 * 1/2 二分音符
 * 1/0 全音符
 */
export class SNNote extends SNBox {
  el: SVGGElement;
  index: number; // 当前是第几个音符
  noteData: string; // 当前音符的原始数据
  weight: number; // 当前音符的权重
  note: string; // 当前音符
  startNote: boolean; // 当前音符是否是起始音符
  endNote: boolean; // 当前音符是否是终止音符
  underlineCount: number; // 当前音符的下划线数量
  x: number; // 当前音符的x轴坐标
  width: number; // 当前音符的宽度

  constructor(measure: SNMeasure, options: SNNoteOptions) {
    super(options.x, measure.innerY, options.width, measure.innerHeight, 0);
    this.index = options.index;
    this.noteData = options.noteData;
    this.weight = options.weight;
    this.note = options.note;
    this.startNote = options.startNote;
    this.endNote = options.endNote;
    this.underlineCount = options.underlineCount;
    this.x = options.x;
    this.width = options.width;
    this.el = SvgUtils.createG({
      tag: `note-${this.index}`,
    });
    measure.el.appendChild(this.el);
    this.drawBorderBox(this.el, SNConfig.debug.borderbox?.note);
    this.draw();
  }

  drawUnderLine(times: number) {
    const y = this.innerY + SNConfig.score.lineHeight - 12;
    for (let i = 0; i < times; i++) {
      const start = {
        x: this.innerX + (this.startNote ? 3 : 0),
        y: y + 4 * i,
      };
      const end = {
        x: this.innerX - (this.endNote ? 3 : 0) + this.innerWidth,
        y: y + 4 * i,
      };
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      line.setAttribute('x1', `${start.x}`);
      line.setAttribute('y1', `${start.y}`);
      line.setAttribute('x2', `${end.x}`);
      line.setAttribute('y2', `${end.y}`);
      line.setAttribute('stroke', 'black');
      line.setAttribute('stroke-width', '1');
      this.el.appendChild(line);
    }
  }

  draw() {
    this.el.appendChild(
      SvgUtils.createText({
        x: this.innerX + this.innerWidth / 2,
        y: this.innerY + (SNConfig.score.lineHeight + 18) / 2,
        text: this.note,
        fontSize: 18,
        fontFamily: 'simsun',
        textAnchor: 'middle',
        strokeWidth: 1,
      }),
    );
    if (this.underlineCount) {
      this.drawUnderLine(this.underlineCount);
    }
    if (SNRuntime.lyric) {
      const word = SNRuntime.lyric[this.index - 1];
      if (word == '-') return;
      const text = SvgUtils.createText({
        x: this.innerX + this.innerWidth / 2,
        y: this.innerY + SNConfig.score.lineHeight + 18,
        text: word,
        fontSize: 14,
        fontFamily: 'simsun',
        textAnchor: 'middle',
      });
      this.el.appendChild(text);
    }
  }
}
