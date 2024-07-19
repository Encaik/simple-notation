import { SNContent } from './content';
import { SNData, SNOptions } from './model';
import { SvgUtils } from './utils/svg';

/* 简谱 */
export class SimpleNotation {
  container: HTMLDivElement;
  el: SVGElement;
  options: SNOptions = {
    width: 0,
    height: 0,
  };
  content: SNContent;

  constructor(container: HTMLDivElement, options?: SNOptions) {
    if (!container) throw new Error('container is null');
    this.container = container;
    this.detailOptions(options);
    this.el = SvgUtils.createSvg(this.options.width!, this.options.height!);
    this.container.appendChild(this.el);
    this.content = new SNContent(this.el, this.options.content);
    this.content.initInfo(this.options.info);
    this.content.initScore(this.options.score);
  }

  loadData(data: SNData) {
    this.content.drawInfo(data.info);
    this.content.drawScore(data.score);
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
}
