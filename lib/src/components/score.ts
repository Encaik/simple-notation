import { SNBox } from '@core';
import { SNContent } from './content';
import { SNScoreOptions } from '@types';
import { SNStave } from './stave';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';

export class SNScore extends SNBox {
  el: SVGGElement;
  stavesData: string[] = []; //乐谱数据
  staves: SNStave[] = []; //乐句
  totalMeasures: number = 0; //乐谱总小节数
  totalNotes: number = 0; //乐谱总音符数

  constructor(content: SNContent, options: SNScoreOptions) {
    super(
      content.innerX,
      content.innerY + (content.info?.height || 0),
      content.innerWidth,
      content.innerHeight - (content.info?.height || 0),
      options.padding,
    );
    this.el = SvgUtils.createG({
      tag: 'score',
    });
    content.el.appendChild(this.el);
    this.drawBorderBox(this.el, SNConfig.debug.borderbox?.score);
  }

  draw(scoreData: string[]) {
    this.stavesData = scoreData;
    this.stavesData.forEach((data, idx) => {
      const stave = new SNStave(this, {
        context: data,
        index: idx,
        currentStave: idx,
        y:
          this.innerY +
          idx *
            (SNConfig.score.lineHeight +
              SNConfig.score.lyricHeight +
              SNConfig.score.lineSpace),
      });
      this.staves.push(stave);
      this.totalMeasures += stave.measures.length;
      this.totalNotes += stave.totalNotes;
    });
  }
}
