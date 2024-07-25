import { SNBoxOptions } from '@types';
export declare class SNBox {
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
  );
  drawBorderBox(el: SVGGElement, options?: SNBoxOptions): void;
  drawOuterBox(options: SNBoxOptions): SVGRectElement;
  drawInnerBox(options: SNBoxOptions): SVGRectElement;
  drawBox(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    lineWidth: number,
  ): SVGRectElement;
}
