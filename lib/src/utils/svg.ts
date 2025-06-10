import {
  SNSvgGOptions,
  SNSvgLineOptions,
  SNSvgRectOptions,
  SNSvgTextOptions,
  SNSvgTspanOptions,
} from '@types';

export class SvgUtils {
  static async getFontBase64(url: string) {
    try {
      // 1. 获取字体文件
      const response = await fetch(url);
      if (!response.ok) throw new Error('网络响应不正常');

      // 2. 获取ArrayBuffer数据
      const arrayBuffer = await response.arrayBuffer();

      // 3. 将ArrayBuffer转换为Base64
      const base64String = SvgUtils.arrayBufferToBase64(arrayBuffer);
      return base64String;
    } catch (error) {
      console.error('获取字体失败:', error);
      return null;
    }
  }

  // ArrayBuffer转Base64的辅助函数
  static arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  static async getFontStyle(el: SVGSVGElement) {
    const style = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'style',
    );
    const fontUrl =
      'https://cdn.jsdelivr.net/fontsource/fonts/bravura@latest/latin-400-normal.woff2';
    const fontBase64 = await SvgUtils.getFontBase64(fontUrl);
    style.textContent = `
      @font-face {
        font-family: 'Bravura';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: url('data:application/x-font-woff;base64,${fontBase64}') format('woff2');
      }
    `;
    el.appendChild(style);
  }

  static createSvg(width: number, height: number) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('width', `${width}`);
    el.setAttribute('height', `${height}`);
    el.setAttribute('style', `display: block;`);
    el.setAttribute('sn-tag', 'root');
    el.setAttribute('id', 'sn-container');
    SvgUtils.getFontStyle(el);
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
    text.setAttribute('fill', `${options.fill || 'black'}`);
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

  static createPath(options: {
    d: string;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
  }) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', options.d);
    path.setAttribute('stroke', options.stroke || 'stroke');
    path.setAttribute('stroke-width', `${options.strokeWidth || 1}`);
    path.setAttribute('fill', options.fill || 'none');
    return path;
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

  /**
   * 绘制吉他和弦图
   * @param chordName 和弦名称
   * @param positions 六根弦的品位位置（从低音弦到高音弦，null表示不画）
   * @param x 左上角x坐标（可选，默认0）
   * @param y 左上角y坐标（可选，默认0）
   * @returns SVG g 元素
   */
  static createGuitarChordDiagram(
    chordName: string,
    positions: (number | null)[],
    x: number = 0,
    y: number = 0,
  ) {
    positions = positions.slice().reverse();
    const group = SvgUtils.createG({ tag: 'guitar-chord-diagram' });
    const width = 36; // 总宽度
    const height = 56; // 总高度
    const fretCount = 4; // 品数
    const stringCount = 6; // 弦数
    const marginTop = 18; // 和弦名到指板距离
    const marginBottom = 8;
    const fretSpacing = (height - marginTop - marginBottom) / fretCount;
    const stringSpacing = width / (stringCount - 1);
    const dotRadius = 2;

    // 1. 和弦名
    const nameText = SvgUtils.createText({
      text: chordName,
      x: x + width / 2,
      y: y + 10,
      fontSize: 12,
      fontFamily: 'serif',
      textAnchor: 'middle',
      stroke: 'none',
    });
    group.appendChild(nameText);

    // 2. 指板（横线：品，竖线：弦）
    // 横线
    for (let i = 0; i <= fretCount; i++) {
      const line = SvgUtils.createLine({
        x1: x,
        y1: y + marginTop + i * fretSpacing,
        x2: x + width,
        y2: y + marginTop + i * fretSpacing,
        stroke: 'black',
        strokeWidth: i === 0 ? 2 : 1, // 顶部为琴枕
      });
      group.appendChild(line);
    }
    // 竖线
    for (let i = 0; i < stringCount; i++) {
      const line = SvgUtils.createLine({
        x1: x + i * stringSpacing,
        y1: y + marginTop,
        x2: x + i * stringSpacing,
        y2: y + marginTop + fretCount * fretSpacing,
        stroke: 'black',
        strokeWidth: 1,
      });
      group.appendChild(line);
    }

    // 3. 按弦点/空弦标记
    for (let i = 0; i < stringCount; i++) {
      const pos = positions[i];
      if (pos === null) continue; // 不画
      const cx = x + i * stringSpacing;
      if (pos === 0) {
        // 空弦，画白心黑边圆，在线上方
        const cy = y + marginTop - fretSpacing / 2;
        const circle = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle',
        );
        circle.setAttribute('cx', `${cx}`);
        circle.setAttribute('cy', `${cy}`);
        circle.setAttribute('r', `${dotRadius}`);
        circle.setAttribute('fill', 'white');
        circle.setAttribute('stroke', 'black');
        circle.setAttribute('stroke-width', '1.5');
        group.appendChild(circle);
      } else if (typeof pos === 'number' && pos > 0) {
        // 按弦，画黑心黑边圆，位置在对应品格线上
        const cy = y + marginTop + (pos - 0.5) * fretSpacing;
        const circle = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle',
        );
        circle.setAttribute('cx', `${cx}`);
        circle.setAttribute('cy', `${cy}`);
        circle.setAttribute('r', `${dotRadius}`);
        circle.setAttribute('fill', 'black');
        circle.setAttribute('stroke', 'black');
        circle.setAttribute('stroke-width', '1');
        group.appendChild(circle);
      }
    }

    return group;
  }
}
