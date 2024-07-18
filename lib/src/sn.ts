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
    if (options) this.detailOptions(options);
    this.el = this.createSvg();
    this.content = new SNContent(this.el, this.options.content);
    this.content.initInfo(this.options.info);
    this.content.initScore(this.options.score);
    this.content.drawInfo({
      title: '小星星',
      composer: '佚名',
    });
    this.content.drawScore([
      '1,1,5,5,6,6,5|4,4,3,3,2,2,1',
      '5,5,4,4,3,3,2|6,6,5,5,4,4,3',
    ]);
  }

  detailOptions(options: Partial<SNOptions>) {
    let { width, height } = options;
    if (!width || !height) {
      const clientWidth =
        this.container.getAttribute('width') || this.container.clientWidth;
      const clientHeight =
        this.container.getAttribute('height') || this.container.clientHeight;
      width =
        typeof clientWidth === 'string' ? parseInt(clientWidth) : clientWidth;
      height =
        typeof clientHeight === 'string'
          ? parseInt(clientHeight)
          : clientHeight;
    }
    this.options = {
      ...this.options,
      width,
      height,
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
