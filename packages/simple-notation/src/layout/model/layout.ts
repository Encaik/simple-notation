export enum SNLayoutNodeType {
  ROOT,
  PAGE,
  BLOCK,
  LINE,
  ELEMENT,
}

export interface SNLayoutProps {
  x: number;
  y: number;
  width: number;
  height: number;
  margin?: SNLayoutMargin;
  padding?: SNLayoutPadding;
  align?: SNLayoutAlign;
  justify?: SNLayoutJustify;
}

export interface SNLayoutMargin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SNLayoutPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export enum SNLayoutAlign {
  LEFT,
  RIGHT,
  CENTER,
}

export enum SNLayoutJustify {
  LEFT,
  RIGHT,
  CENTER,
  BETWEEN,
}
