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
    text.textContent = options.text;
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
}
