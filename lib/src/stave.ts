import { SNBox } from './box';
import { SNMeasure } from './measure';
import { SNPoint, SNStaveOptions } from './model';
import { SNScore } from './score';
import { SvgUtils } from './utils/svg';

/* 乐句 */
export class SNStave extends SNBox {
  el: SVGGElement;
  measureData: string[];
  measures: SNMeasure[] = [];
  index: number;
  totalMeasures: number;
  totalNotes: number;
  staveNotes: number = 0;

  constructor(score: SNScore, options: SNStaveOptions) {
    super(score.innerX, options.y, score.innerWidth, options.height, [10, 0]);
    this.index = options.index;
    this.totalMeasures = score.totalMeasures;
    this.totalNotes = score.totalNotes;
    this.measureData = options.context.trim().split('|');
    this.el = SvgUtils.createG({
      tag: `stave-${this.index}`,
    });
    score.el.appendChild(this.el);
    // this.drawAuxiliaryLine(this.el, {
    //   inner: true,
    // });
    this.draw();
  }

  addLine(start: SNPoint, end: SNPoint) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', `${start.x}`);
    line.setAttribute('y1', `${start.y + 10}`);
    line.setAttribute('x2', `${end.x}`);
    line.setAttribute('y2', `${end.y - 10}`);
    line.setAttribute('stroke', 'black');
    this.el.appendChild(line);
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
      this.addLine(
        { x: measure.x, y: measure.y },
        { x: measure.x, y: measure.y + measure.height },
      );
    });
    this.addLine(
      { x: this.innerX + this.innerWidth, y: this.innerY },
      { x: this.innerX + this.innerWidth, y: this.innerY + this.innerHeight },
    );
  }
}
