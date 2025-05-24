import {
  SNSvgGOptions,
  SNSvgLineOptions,
  SNSvgRectOptions,
  SNSvgTextOptions,
  SNSvgTspanOptions,
} from '@types';

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

  static createTspan(options: SNSvgTspanOptions) {
    const tspan = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'tspan',
    );
    if (options.x !== undefined) tspan.setAttribute('x', `${options.x}`);
    if (options.y !== undefined) tspan.setAttribute('y', `${options.y}`);
    if (options.dx !== undefined)
      tspan.setAttribute('dx', `${options.dx || 0}`);
    if (options.dy !== undefined)
      tspan.setAttribute('dy', `${options.dy || 0}`);
    tspan.setAttribute('font-size', `${options.fontSize || '14px'}`);
    tspan.setAttribute('font-family', `${options.fontFamily || 'sans-serif'}`);
    tspan.setAttribute('font-weight', `${options.fontWeight || 'normal'}`);
    tspan.setAttribute('stroke', `${options.stroke || 'black'}`);
    tspan.setAttribute('stroke-width', `${options.strokeWidth || 0}`);
    tspan.setAttribute('text-anchor', options.textAnchor || 'start');
    tspan.textContent = options.text || '';
    return tspan;
  }

  static createRect(options: SNSvgRectOptions) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', `${options.x}`);
    rect.setAttribute('y', `${options.y}`);
    rect.setAttribute('width', `${options.width}`);
    rect.setAttribute('height', `${options.height}`);
    rect.setAttribute('rx', `${options.rx || 0}`);
    rect.setAttribute('ry', `${options.ry || 0}`);
    rect.setAttribute('fill', `${options.fill || 'none'}`);
    rect.setAttribute('stroke', `${options.stroke || 'black'}`);
    rect.setAttribute('stroke-width', `${options.strokeWidth || 0}`);
    return rect;
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

  /**
   * 创建repeat循环的两个圆点
   * @param x - 基准x坐标
   * @param y - 基准y坐标
   * @param direction - 'left'点在左，'right'点在右
   * @returns SVG g 元素
   */
  static createRepeatDots(x: number, y: number, direction: 'left' | 'right') {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const r = 1.8;
    const offset = direction === 'left' ? -5 : 5;
    for (let i = 0; i < 2; i++) {
      const cy = y + i * 20;
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
      );
      circle.setAttribute('cx', (x + offset).toString());
      circle.setAttribute('cy', cy.toString());
      circle.setAttribute('r', r.toString());
      circle.setAttribute('fill', 'black');
      group.appendChild(circle);
    }
    return group;
  }
}
