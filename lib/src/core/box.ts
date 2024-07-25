import { SNBorderBoxOptions } from '@types';

export class SNBox {
  x: number;
  y: number;
  width: number;
  height: number;
  innerX: number;
  innerY: number;
  innerWidth: number;
  innerHeight: number;
  paddingX: number;
  paddingY: number;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    padding?: number | number[],
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    if (Array.isArray(padding)) {
      this.paddingX = padding[0];
      this.paddingY = padding[1];
    } else if (typeof padding === 'number') {
      this.paddingX = padding;
      this.paddingY = padding;
    } else {
      this.paddingX = 10;
      this.paddingY = 10;
    }
    this.innerX = x + this.paddingX;
    this.innerY = y + this.paddingY;
    this.innerWidth = width - 2 * this.paddingX;
    this.innerHeight = height - 2 * this.paddingY;
  }

  drawBorderBox(el: SVGGElement, options?: SNBorderBoxOptions) {
    options?.inner && el.appendChild(this.drawInnerBox(options));
    options?.outer && el.appendChild(this.drawOuterBox(options));
  }

  drawOuterBox(options: SNBorderBoxOptions) {
    return this.drawBox(
      this.x,
      this.y,
      this.width,
      this.height,
      options?.outerColor || 'black',
      options?.outerLineWidth || 1,
    );
  }

  drawInnerBox(options: SNBorderBoxOptions) {
    return this.drawBox(
      this.innerX,
      this.innerY,
      this.innerWidth,
      this.innerHeight,
      options?.innerColor || 'red',
      options?.innerLineWidth || 1,
    );
  }

  drawBox(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    lineWidth: number,
  ) {
    const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    box.setAttribute('x', `${x}`);
    box.setAttribute('y', `${y}`);
    box.setAttribute('width', `${width}`);
    box.setAttribute('height', `${height}`);
    box.setAttribute('fill', 'none');
    box.setAttribute('stroke', color);
    box.setAttribute('stroke-width', `${lineWidth}`);
    return box;
  }
}
