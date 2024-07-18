import { SNInfoContextOptions, SNInfoOptions } from './model';
import { SNContent } from './content';
import { SNBox } from './box';

export class SNInfo extends SNBox {
  el: SVGGElement;
  title: string;
  composer: string;
  titleEl: SVGTextElement | undefined;
  composerEl: SVGTextElement | undefined;

  constructor(content: SNContent, options?: SNInfoOptions) {
    super(
      content.innerX,
      content.innerY,
      content.innerWidth,
      options?.height || 100,
      options?.padding,
    );
    this.title = options?.title || '';
    this.composer = options?.composer || '';
    this.el = this.createSvg(content.el);
    // this.drawAuxiliaryLine(this.el, {
    //   inner: true,
    //   outer: true,
    // });
    this.draw();
  }

  createSvg(parentEl: SVGGElement) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.setAttribute('sn-tag', 'info');
    parentEl.appendChild(el);
    return el;
  }

  drawTitle(title: string) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', `${this.innerX + this.innerWidth / 2}`);
    text.setAttribute('y', `${this.innerY + (this.innerHeight + 18) / 2}`);
    text.setAttribute('font-size', '26px');
    text.setAttribute('font-family', 'sans-serif');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = title;
    this.el.appendChild(text);
    return text;
  }

  drawComposer(composer: string) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', `${this.innerX + this.innerWidth}`);
    text.setAttribute('y', `${this.innerY + this.innerHeight}`);
    text.setAttribute('font-size', '12px');
    text.setAttribute('font-family', 'sans-serif');
    text.setAttribute('text-anchor', 'end');
    text.textContent = `作曲：${composer}`;
    this.el.appendChild(text);
    return text;
  }

  draw(options?: SNInfoContextOptions) {
    if (this.titleEl) {
      this.titleEl.textContent = options?.title || this.title;
    } else {
      this.titleEl = this.drawTitle(options?.title || this.title);
    }
    if (this.composerEl) {
      this.composerEl.textContent = `作曲：${options?.composer || this.composer}`;
    } else {
      this.composerEl = this.drawComposer(options?.composer || this.composer);
    }
  }
}
