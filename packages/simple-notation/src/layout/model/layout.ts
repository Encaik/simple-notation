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
  /** 宽度：number 表示固定宽度，null 或 'auto' 表示自适应 */
  width: number | null | 'auto';
  /** 高度：number 表示固定高度，null 或 'auto' 表示自适应 */
  height: number | null | 'auto';
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
