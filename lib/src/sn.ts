import { SNContent } from './content';
import { SNOptions } from './model';

/* 简谱 */
export class SimpleNotation {
  container: HTMLDivElement;
  el: SVGElement | undefined;
  options: SNOptions = {
    width: 0,
    height: 0,
  };
  content: SNContent | undefined;

  constructor(container: HTMLDivElement, options?: SNOptions) {
    if (!container) throw new Error('container is null');
    this.container = container;
    this.detailOptions(options);
    this.el = this.createSvg();
    this.content = new SNContent(this.el, this.options.content);
    this.content.initInfo(this.options.info);
    this.content.initScore(this.options.score);
    this.content.drawInfo({
      title: '未闻花名',
      composer: '佚名',
    });
    this.content.drawScore([
      `-,-,-,0/16,1/16,4/16,5/16|
      5/16,6/16,6/16,6/16,6/16,6/8,6/16,6/16,5/16,5/16,5/16,5/16,5/8,5/16|
      5/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,1/16,1/16,0/16,1/16,4/16,5/16`,
      `5/16,6/16,6/16,6/16,6/16,6/16,6/16,1/16+,0/16,6/16,6/16,6/16,6/16,6/16,5/16,4/16|
      5/8.,6/16,6,-,0/8,5/16,6/16|5/8.,4/16,4,-,0/8,5/16,6/16`,
      `5/8.,4/16,4,-,-`,
    ]);
  }

  detailOptions(options?: SNOptions) {
    const width =
      options?.width ||
      this.container.getAttribute('width') ||
      this.container.clientWidth ||
      500;
    const height =
      options?.height ||
      this.container.getAttribute('height') ||
      this.container.clientHeight ||
      800;
    this.options = {
      ...this.options,
      width: typeof width === 'string' ? parseInt(width) : width,
      height: typeof height === 'string' ? parseInt(height) : height,
    };
  }

  createSvg() {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('width', `${this.options.width}`);
    el.setAttribute('height', `${this.options.height}`);
    this.container.appendChild(el);
    return el;
  }
}
