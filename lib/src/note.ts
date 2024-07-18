import { SNBox } from './box';
import { SNMeasure } from './measure';
import { SNNoteOptions } from './model';

/* 乐句 */
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

  draw() {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', `${this.innerX + this.innerWidth / 2}`);
    text.setAttribute('y', `${this.innerY + (this.innerHeight + 18) / 2}`);
    text.setAttribute('font-size', '20px');
    text.setAttribute('font-family', 'sans-serif');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = this.noteData;
    this.el.appendChild(text);
  }
}
