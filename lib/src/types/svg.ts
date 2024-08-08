export interface SNSvgTextOptions {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  stroke?: string;
  strokeWidth?: number;
  textAnchor?: string;
}

export interface SNSvgGOptions {
  tag: string;
}

export interface SNSvgLineOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
}
