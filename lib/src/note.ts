import { SvgUtils } from '../main';
import { SNBox } from './box';
import { SNMeasure } from './measure';
import { SNNoteOptions } from './model';

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
  noteData: string;

  constructor(measure: SNMeasure, options: SNNoteOptions) {
    super(options.x, measure.innerY, options.width, measure.innerHeight, 0);
    this.noteData = options.context.trim();
    this.el = this.createSvg(measure.el);
    // this.drawAuxiliaryLine(this.el, {
    //   inner: true,
    // });
    this.draw();
  }

  createSvg(parentEl: SVGGElement) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.setAttribute('sn-tag', 'note');
    parentEl.appendChild(el);
    return el;
  }

  drawUnderLine(times: number) {
    const y = this.innerY + this.innerHeight - 12;
    for (let i = 0; i < times; i++) {
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      line.setAttribute('x1', `${this.innerX}`);
      line.setAttribute('y1', `${y + 4 * i}`);
      line.setAttribute('x2', `${this.innerX + this.innerWidth}`);
      line.setAttribute('y2', `${y + 4 * i}`);
      line.setAttribute('stroke', 'black');
      line.setAttribute('stroke-width', '1');
      this.el.appendChild(line);
    }
  }

  draw() {
    let duration = '';
    let upCount = 0;
    let downCount = 0;
    this.noteData = this.noteData.replaceAll(/\/\d+|\++|\-+/g, (match) => {
      switch (match) {
        case '+':
          upCount++;
          break;
        case '-':
          downCount++;
          break;
        default:
          duration = match.substring(1);
          break;
      }
      return '';
    });
    if (duration) {
      this.drawUnderLine(Math.log2(Number(duration)) - 2);
    }
    if (downCount && !this.noteData) {
      this.noteData = '-';
      downCount = 0;
    }
    this.el.appendChild(
      SvgUtils.createText({
        x: this.innerX + this.innerWidth / 2,
        y: this.innerY + (this.innerHeight + 18) / 2,
        text: this.noteData,
        fontSize: 18,
        fontFamily: 'simsun',
        textAnchor: 'middle',
        strokeWidth: 1,
      }),
    );
  }
}
