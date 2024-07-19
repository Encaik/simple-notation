import { SNBox } from '@core';
import { SNContent } from './content';
import { SNScoreOptions } from '@types';
import { SNStave } from './stave';
import { SvgUtils } from '@utils';

export class SNScore extends SNBox {
  el: SVGGElement;
  stavesData: string[] = [];
  staves: SNStave[] = [];
  lineHeight: number;
  lineSpace: number;
  totalMeasures: number = 0;
  totalNotes: number = 0;

  constructor(content: SNContent, options?: SNScoreOptions) {
    super(
      content.innerX,
      content.innerY + (content.info?.height || 0),
      content.innerWidth,
      content.innerHeight - (content.info?.height || 0),
      options?.padding,
    );
    this.lineHeight = options?.lineHeight || 50;
    this.lineSpace = options?.lineSpace || 10;
    this.el = SvgUtils.createG({
      tag: 'score',
    });
    content.el.appendChild(this.el);
    // this.drawAuxiliaryLine(this.el, {
    //   inner: true,
    //   outer: true,
    // });
  }

  draw(scoreData: string[]) {
    this.stavesData = scoreData;
    this.stavesData.forEach((data, idx) => {
      const stave = new SNStave(this, {
        context: data,
        index: idx,
        currentStave: idx,
        y: this.innerY + idx * (this.lineHeight + this.lineSpace),
        height: this.lineHeight,
      });
      this.staves.push(stave);
      this.totalMeasures += stave.measures.length;
      this.totalNotes += stave.totalNotes;
    });
  }
}
