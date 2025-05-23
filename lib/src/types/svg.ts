/**
 * SVG文本元素配置。
 * @property {number} x - 文本x轴坐标。
 * @property {number} y - 文本y轴坐标。
 * @property {string} [text] - 文本内容。
 * @property {number} [fontSize] - 字体大小。
 * @property {string} [fontFamily] - 字体。
 * @property {string} [fontWeight] - 字重。
 * @property {string} [stroke] - 描边颜色。
 * @property {number} [strokeWidth] - 描边宽度。
 * @property {string} [textAnchor] - 对齐方式。
 */
export interface SNSvgTextOptions {
  x: number;
  y: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  stroke?: string;
  strokeWidth?: number;
  textAnchor?: string;
}

/**
 * SVG分组元素配置。
 * @property {string} tag - 分组标签名。
 */
export interface SNSvgGOptions {
  tag: string;
}

/**
 * SVG直线元素配置。
 * @property {number} x1 - 起点x坐标。
 * @property {number} y1 - 起点y坐标。
 * @property {number} x2 - 终点x坐标。
 * @property {number} y2 - 终点y坐标。
 * @property {string} [stroke] - 线条颜色。
 * @property {number} [strokeWidth] - 线条宽度。
 */
export interface SNSvgLineOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
}
