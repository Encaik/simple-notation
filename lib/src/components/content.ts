import { SNBox } from '@core';
import { SNInfo } from './info';
import {
  SNInfoOptions,
  SNContentOptions,
  SNScoreOptions,
  SNDataInfo,
} from '@types';
import { SNScore } from './score';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';

export class SNContent extends SNBox {
  el: SVGGElement;
  info: SNInfo | undefined;
  score: SNScore | undefined;

  constructor(svg: SVGElement, options: SNContentOptions) {
    super(0, 0, svg.clientWidth, svg.clientHeight, options.padding);
    this.el = SvgUtils.createG({
      tag: 'content',
    });
    svg.appendChild(this.el);
    this.drawBorderBox(this.el, SNConfig.debug.borderbox?.content);
    this.initInfo(SNConfig.info);
    this.initScore(SNConfig.score);
  }

  initInfo(options: SNInfoOptions) {
    this.info = new SNInfo(this, options);
  }

  drawInfo(options: SNDataInfo) {
    this.info?.draw(options);
  }

  initScore(options: SNScoreOptions) {
    this.score = new SNScore(this, options);
  }

  drawScore(scoreData: string) {
    this.score?.draw(scoreData);
  }
}
