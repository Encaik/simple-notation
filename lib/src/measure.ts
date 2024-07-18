import { SNBox } from './box';
import { SNMeasureOptions } from './model';
import { SNNote } from './note';
import { SNStave } from './stave';

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
    this.el = this.createSvg(stave.el);
    // this.drawAuxiliaryLine(this.el, {
    //   inner: true,
    //   outer: true,
    // });
    this.draw();
  }

  createSvg(parentEl: SVGGElement) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.setAttribute('sn-tag', 'measure');
    parentEl.appendChild(el);
    return el;
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
    this.notesData.forEach((data, idx) => {
      const note = new SNNote(this, {
        context: data,
        index: idx,
        currentNote: this.totalNotes + idx,
        x: this.innerX + idx * unitWidth,
        width: unitWidth,
      });
      this.notes.push(note);
    });
  }
}
