import { SNBox } from '@core';
import { SNMeasureOptions } from '@types';
import { SNNote } from './note';
import { SNStave } from './stave';
import { SvgUtils } from '@utils';

/* 小节 */
export class SNMeasure extends SNBox {
  el: SVGGElement;
  notesData: string[];
  notes: SNNote[] = [];
  index: number;
  totalNotes: number;

  constructor(stave: SNStave, options: SNMeasureOptions) {
    super(options.x, stave.innerY, options.width, stave.innerHeight, [5, 0]);
    this.index = options.currentMeasure;
    this.totalNotes = stave.totalNotes;
    this.notesData = options.context.trim().split(',');
    this.el = SvgUtils.createG({
      tag: `measure-${this.index}`,
    });
    stave.el.appendChild(this.el);
    // this.drawBorderBox(this.el, {
    //   inner: true,
    //   outer: true,
    // });
    this.draw();
  }

  drawCount() {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', `${this.x - 1}`);
    text.setAttribute('y', `${this.y + 2}`);
    text.setAttribute('font-size', '10px');
    text.setAttribute('font-family', 'sans-serif');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = `${this.index + 1}`;
    this.el.appendChild(text);
  }

  draw() {
    this.drawCount();
    const unitWidth = this.innerWidth / this.notesData.length;
    let totalTime = 0;
    this.notesData.forEach((data, idx) => {
      let duration = '';
      let upCount = 0;
      let downCount = 0;
      let underlineCount = 0;
      let startNote = totalTime % 1 == 0;
      let note = data.replaceAll(/\/\d+|\++|\-+/g, (match) => {
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
        switch (duration) {
          case '0':
            underlineCount = 0;
            totalTime += 4;
            break;
          case '2':
            underlineCount = 0;
            totalTime += 2;
            break;
          case '8':
            underlineCount = 1;
            totalTime += 0.5;
            break;
          case '16':
            underlineCount = 2;
            totalTime += 0.25;
            break;
          case '32':
            underlineCount = 3;
            totalTime += 0.125;
            break;
          default:
            underlineCount = 0;
            totalTime += 1;
            break;
        }
      } else {
        totalTime += 1;
      }
      if (downCount && !note) {
        note = '-';
        downCount = 0;
      }
      const snnote = new SNNote(this, {
        context: note,
        index: idx,
        currentNote: this.totalNotes + idx,
        x: this.innerX + idx * unitWidth,
        width: unitWidth,
        startNote,
        endNote: totalTime % 1 == 0,
        underlineCount,
      });
      this.notes.push(snnote);
    });
  }
}
