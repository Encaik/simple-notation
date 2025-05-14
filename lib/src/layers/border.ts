import { Logger, SvgUtils } from '@utils';

export class SNBorderLayer {
  /** SVG group 元素，作为内容的容器 */
  static el: SVGGElement;

  static borderMap: Map<string, SVGRectElement> = new Map();

  constructor(svg: SVGElement) {
    Logger.debug('constructor 初始化边框层', 'SNBorderLayer');
    SNBorderLayer.el = SvgUtils.createG({ tag: 'border' });
    svg.appendChild(SNBorderLayer.el);
  }

  static addBorderBox(borderType: string, el: SVGRectElement) {
    if (SNBorderLayer.borderMap.has(borderType)) {
      SNBorderLayer.borderMap.get(borderType)?.remove();
      SNBorderLayer.borderMap.delete(borderType);
    }
    SNBorderLayer.borderMap.set(borderType, el);
    el.setAttribute('border-type', borderType);
    SNBorderLayer.el.appendChild(el);
  }

  static destroyed() {
    SNBorderLayer.borderMap.forEach((el) => {
      el.remove();
    });
    SNBorderLayer.borderMap.clear();
    SNBorderLayer.el.remove();
  }
}
