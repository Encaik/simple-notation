import { SNTextOptions } from '../model';

export class SvgUtils {
  static createText(options: SNTextOptions) {
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
}
