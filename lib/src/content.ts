import { SNBox } from './box';
import { SNInfo } from './info';
import {
  SNInfoOptions,
  SNContentOptions,
  SNScoreOptions,
  SNInfoContextOptions,
} from './model';
import { SNScore } from './score';

export class SNContent extends SNBox {
  el: SVGGElement;
  info: SNInfo | undefined;
  score: SNScore | undefined;

  constructor(svg: SVGElement, options?: SNContentOptions) {
    super(0, 0, svg.clientWidth, svg.clientHeight, options?.padding);
    this.el = this.createSvg(svg);
    // this.drawAuxiliaryLine(this.el, {
    //   inner: true,
    //   outer: true,
    // });
  }

  createSvg(parentEl: SVGElement) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.setAttribute('sn-tag', 'content');
    parentEl.appendChild(el);
    return el;
  }

  initInfo(options?: SNInfoOptions) {
    this.info = new SNInfo(this, options);
  }

  drawInfo(options: SNInfoContextOptions) {
    this.info?.draw(options);
  }

  initScore(options?: SNScoreOptions) {
    this.score = new SNScore(this, options);
  }

  drawScore(scoreData: string[]) {
    this.score?.draw(scoreData);
  }
}
