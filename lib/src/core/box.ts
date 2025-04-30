import { SNBorderBoxOptions, SNBoxType, SNPoint } from '@types';

export class SNBox {
  parent: SNBox | null;
  type: SNBoxType;
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
    parent: SNBox | null,
    type: SNBoxType,
    x: number,
    y: number,
    width: number,
    height: number,
    padding?: number | number[],
  ) {
    this.parent = parent;
    this.type = type;
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

  getSNPointByLayer(boxType: SNBoxType) {
    let currentBox: SNBox | null = this.parent;
    const point: SNPoint = { x: this.x, y: this.y };
    while (currentBox) {
      if (currentBox.type === boxType) {
        break;
      }
      point.x += currentBox.paddingX;
      point.y += currentBox.paddingY;
      currentBox = currentBox.parent;
    }
    return point;
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
