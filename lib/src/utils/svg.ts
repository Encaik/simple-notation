import { SNSvgGOptions, SNSvgLineOptions, SNSvgTextOptions } from '@types';

export class SvgUtils {
  static createSvg(width: number, height: number) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('width', `${width}`);
    el.setAttribute('height', `${height}`);
    return el;
  }

  static createG(options: SNSvgGOptions) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('sn-tag', options.tag);
    return g;
  }

  static createText(options: SNSvgTextOptions) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', `${options.x}`);
    text.setAttribute('y', `${options.y}`);
    text.setAttribute('font-size', `${options.fontSize || '14px'}`);
    text.setAttribute('font-family', `${options.fontFamily || 'sans-serif'}`);
    text.setAttribute('font-weight', `${options.fontWeight || 'normal'}`);
    text.setAttribute('stroke', `${options.stroke || 'black'}`);
    text.setAttribute('stroke-width', `${options.strokeWidth || 0}`);
    text.setAttribute('text-anchor', options.textAnchor || 'start');
    text.textContent = options.text || '';
    return text;
  }

  static createLine(options: SNSvgLineOptions) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', `${options.x1}`);
    line.setAttribute('y1', `${options.y1}`);
    line.setAttribute('x2', `${options.x2}`);
    line.setAttribute('y2', `${options.y2}`);
    line.setAttribute('stroke', `${options.stroke || 'black'}`);
    line.setAttribute('stroke-width', `${options.strokeWidth || 1}`);
    return line;
  }

  /**
   * 创建一个 SVG 弧线元素
   * @param options - 弧线的配置选项
   * @returns SVG 弧线元素
   */
  static createArc(options: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    radiusX: number;
    radiusY: number;
    rotation: number;
    largeArcFlag: boolean;
    sweepFlag: boolean;
    stroke?: string;
    strokeWidth?: number;
  }) {
    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${options.x1} ${options.y1} A ${options.radiusX} ${options.radiusY} ${options.rotation} ${options.largeArcFlag ? 1 : 0} ${options.sweepFlag ? 1 : 0} ${options.x2} ${options.y2}`;
    arc.setAttribute('d', d);
    arc.setAttribute('stroke', options.stroke || 'black');
    arc.setAttribute('stroke-width', `${options.strokeWidth || 1}`);
    arc.setAttribute('fill', 'none');
    return arc;
  }
}
