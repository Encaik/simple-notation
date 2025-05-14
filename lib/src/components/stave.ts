import { SNBox } from '@core';
import { SNMeasure } from './measure';
import { SNBoxType, SNMeasureOptions, SNStaveOptions } from '@types';
import { SNScore } from './score';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';

/**
 * SNStave 类 - 简谱乐句（谱表）渲染组件
 *
 * @class SNStave
 * @extends {SNBox}
 * @description
 * 这个类负责渲染简谱中的一个乐句（谱表），包括小节线、
 * 结束线等。它会根据权重自动计算每个小节的宽度，并确保
 * 整体布局的合理性。
 */
export class SNStave extends SNBox {
  /** SVG group 元素，作为乐句的容器 */
  el: SVGGElement;

  /** 当前乐句的索引号（从1开始） */
  index: number;

  /** 乐句的总权重（用于计算宽度） */
  weight: number;

  /** 当前乐句中所有小节的配置选项 */
  measureOptions: SNMeasureOptions[] = [];

  /** 当前乐句中所有小节的实例 */
  measures: SNMeasure[] = [];

  /** 乐句在画布上的垂直位置 */
  y: number;

  /** 标记是否为最后一个乐句 */
  endLine: boolean;

  /**
   * 创建一个新的乐句实例
   *
   * @param score - 父级谱面组件
   * @param options - 乐句的配置选项
   * @description
   * 构造函数会：
   * 1. 初始化乐句的位置和大小
   * 2. 设置基本属性（索引、权重等）
   * 3. 计算实际宽度
   * 4. 创建 SVG group 元素
   * 5. 绘制调试边界框（如果启用）
   * 6. 开始渲染乐句内容
   */
  constructor(score: SNScore, options: SNStaveOptions) {
    super(
      score,
      SNBoxType.STAVE,
      score.innerX,
      options.y,
      score.innerWidth,
      SNConfig.score.lineHeight + SNConfig.score.lyricHeight,
      [10, 0],
    );
    this.index = options.index;
    this.weight = options.weight;
    this.measureOptions = options.measureOptions;
    this.y = options.y;
    this.endLine = options.endLine;
    this.el = SvgUtils.createG({
      tag: `stave-${this.index}`,
    });
    score.el.appendChild(this.el);
    this.draw();
    this.drawBorderBox(SNBoxType.STAVE, SNConfig.debug.borderbox?.stave, this.index);
  }

  /**
   * 绘制乐句结束线
   *
   * @description
   * 在乐句末尾绘制结束线。如果是整个谱面的最后一个乐句，
   * 会绘制双线（粗线）表示终止。结束线的高度与五线谱线
   * 保持一致。
   */
  drawMeasureEndLine() {
    this.el.appendChild(
      SvgUtils.createLine({
        x1: this.innerX + this.innerWidth,
        y1: this.innerY + 10,
        x2: this.innerX + this.innerWidth,
        y2: this.innerY + SNConfig.score.lineHeight,
      }),
    );
    if (this.endLine) {
      this.el.appendChild(
        SvgUtils.createLine({
          x1: this.innerX + this.innerWidth + 3,
          y1: this.innerY + 10,
          x2: this.innerX + this.innerWidth + 3,
          y2: this.innerY + SNConfig.score.lineHeight,
          strokeWidth: 3,
        }),
      );
    }
  }

  /**
   * 绘制小节线
   *
   * @param measure - 小节实例
   * @description
   * 在每个小节的开始位置绘制小节线。小节线的高度与
   * 五线谱线保持一致。
   */
  drawMeasureLine(measure: SNMeasure) {
    this.el.appendChild(
      SvgUtils.createLine({
        x1: measure.x,
        y1: measure.y + 10,
        x2: measure.x,
        y2: measure.y + SNConfig.score.lineHeight,
      }),
    );
  }

  /**
   * 绘制完整的乐句
   *
   * @description
   * 完整的乐句渲染流程：
   * 1. 计算单位宽度（每个权重对应的像素值）
   * 2. 遍历所有小节配置
   * 3. 计算每个小节的位置和宽度
   * 4. 创建并渲染小节
   * 5. 绘制小节线
   * 6. 最后绘制结束线
   */
  draw() {
    const unitWidth = this.innerWidth / this.weight;
    let totalX = this.innerX;
    this.measureOptions.forEach((option) => {
      option.x = totalX;
      option.width = unitWidth * option.weight;
      const measure = new SNMeasure(this, option);
      this.measures.push(measure);
      this.drawMeasureLine(measure);
      totalX += option.width;
    });
    this.drawMeasureEndLine();
  }
}
