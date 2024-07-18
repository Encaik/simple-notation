import { SNInfoContextOptions, SNInfoOptions } from './model';
import { SNContent } from './content';
import { SNBox } from './box';
import { SvgUtils } from '../main';

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
    const text = SvgUtils.createText({
      x: this.innerX + this.innerWidth / 2,
      y: this.innerY + (this.innerHeight - 30) / 2,
      text: title,
      fontSize: 30,
      fontFamily: 'simsun, sans-serif',
      fontWeight: 'bolder',
      textAnchor: 'middle',
    });
    this.el.appendChild(text);
    return text;
  }

  drawComposer(composer: string) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', `${this.innerX + this.innerWidth - 70}`);
    text.setAttribute('y', `${this.innerY + this.innerHeight}`);
    text.setAttribute('font-size', '14px');
    text.setAttribute('font-family', 'simsun, sans-serif');
    text.setAttribute('text-anchor', 'start');
    text.textContent = `作曲：${composer}`;
    this.el.appendChild(text);
    return text;
  }

  drawLyricst() {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', `${this.innerX + this.innerWidth - 70}`);
    text.setAttribute('y', `${this.innerY + this.innerHeight - 20}`);
    text.setAttribute('font-size', '14px');
    text.setAttribute('font-family', 'simsun, sans-serif');
    text.setAttribute('text-anchor', 'start');
    text.textContent = '谱曲：';
    this.el.appendChild(text);
    return text;
  }

  drawTime() {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', `${this.innerX + 50}`);
    text.setAttribute('y', `${this.innerY + this.innerHeight - 20}`);
    text.setAttribute('font-size', '14px');
    text.setAttribute('font-family', 'simsun, sans-serif');
    text.setAttribute('font-weight', 'bolder');
    text.setAttribute('text-anchor', 'start');
    text.textContent = '4/4';
    this.el.appendChild(text);
    return text;
  }

  drawKey() {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', `${this.innerX}`);
    text.setAttribute('y', `${this.innerY + this.innerHeight - 20}`);
    text.setAttribute('font-size', '14px');
    text.setAttribute('font-family', 'simsun, sans-serif');
    text.setAttribute('text-anchor', 'start');
    text.textContent = '1 = C';
    this.el.appendChild(text);
    return text;
  }

  drawTempo() {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', `${this.innerX}`);
    text.setAttribute('y', `${this.innerY + this.innerHeight}`);
    text.setAttribute('font-size', '14px');
    text.setAttribute('font-family', 'simsun, sans-serif');
    text.setAttribute('text-anchor', 'start');
    text.textContent = '♩ = 80';
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
    this.drawLyricst();
    this.drawKey();
    this.drawTime();
    this.drawTempo();
  }
}