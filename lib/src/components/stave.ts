import { SNBox } from '@core';
import { SNMeasure } from './measure';
import {
  SNBoxType,
  SNMeasureOptions,
  SNScoreType,
  SNStaveOptions,
} from '@types';
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

  /** 小节线预留宽度（像素） */
  static BAR_LINE_WIDTH = 5;

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
      SNConfig.score.chordHeight +
        SNConfig.score.lineHeight +
        (SNConfig.score.showChordLine ? SNConfig.score.chordLineHeight : 0) +
        SNConfig.score.lyricHeight,
      [10, 0],
    );
    this.index = options.index;
    this.weight = options.weight;
    this.measureOptions = options.measureOptions;
    this.y = options.y;
    this.endLine = options.endLine;
    SNStave.BAR_LINE_WIDTH =
      SNConfig.score.scoreType === SNScoreType.Simple ? 5 : 0;
    this.el = SvgUtils.createG({
      tag: `stave-${this.index}`,
    });
    this.el.setAttribute(
      'style',
      `page-break-inside: avoid;break-inside: avoid;pointer-events: none;`,
    );

    score.el.appendChild(this.el);
    this.draw();
    this.drawBorderBox(
      SNBoxType.STAVE,
      SNConfig.debug.borderbox?.stave,
      this.index,
    );
  }

  /**
   * 绘制乐句结束线
   *
   * @description
   * 在乐句末尾绘制结束线。如果是整个谱面的最后一个乐句，
   * 会绘制双线（粗线）表示终止。结束线的高度与五线谱线
   * 保持一致。
   */
  drawMeasureEndLine(x: number) {
    const yOffset = SNConfig.score.chordHeight;
    const lineHeight = SNConfig.score.lineHeight;

    const y1 = this.innerY + 10 + yOffset;
    const y2 = this.innerY + yOffset + lineHeight;

    this.el.appendChild(
      SvgUtils.createLine({
        x1: this.innerX + x,
        y1: y1,
        x2: this.innerX + x,
        y2: y2,
      }),
    );
    if (this.endLine) {
      this.el.appendChild(
        SvgUtils.createLine({
          x1: this.innerX + x + 3,
          y1: y1,
          x2: this.innerX + x + 3,
          y2: y2,
          strokeWidth: 3,
        }),
      );
    }
  }

  /**
   * 绘制repeat开始线（左粗右细+右两点）
   */
  drawRepeatStartLine(x: number, yTop: number, yBottom: number) {
    // 左粗线
    this.el.appendChild(
      SvgUtils.createLine({
        x1: x,
        y1: yTop,
        x2: x,
        y2: yBottom,
        strokeWidth: 3,
      }),
    );
    // 右细线
    this.el.appendChild(
      SvgUtils.createLine({
        x1: x + 4,
        y1: yTop,
        x2: x + 4,
        y2: yBottom,
        strokeWidth: 1,
      }),
    );
    // 右两点
    this.el.appendChild(
      SvgUtils.createRepeatDots(x + 4, yTop + (yBottom - yTop) / 4, 'right'),
    );
  }

  /**
   * 绘制repeat结束线（左细右粗+左两点）
   */
  drawRepeatEndLine(x: number, yTop: number, yBottom: number) {
    // 左细线
    this.el.appendChild(
      SvgUtils.createLine({
        x1: x,
        y1: yTop,
        x2: x,
        y2: yBottom,
        strokeWidth: 1,
      }),
    );
    // 右粗线
    this.el.appendChild(
      SvgUtils.createLine({
        x1: x + 4,
        y1: yTop,
        x2: x + 4,
        y2: yBottom,
        strokeWidth: 3,
      }),
    );
    // 左两点
    this.el.appendChild(
      SvgUtils.createRepeatDots(x, yTop + (yBottom - yTop) / 4, 'left'),
    );
  }

  /**
   * 绘制普通小节线
   */
  drawBarLine(x: number, yTop: number, yBottom: number) {
    this.el.appendChild(
      SvgUtils.createLine({
        x1: x,
        y1: yTop,
        x2: x,
        y2: yBottom,
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
   * 5. 绘制小节左侧的线
   * 6. 如果小节有repeatEnd标记，绘制右侧的repeat结束标记
   * 7. 最后绘制整个乐句的结束线（如果最后一个小节没有repeatEnd）
   *
   * 特殊处理：
   * 如果当前乐句为最后一行且只有一个小节，则该小节宽度自适应内容宽度，不再强行撑满整行。
   */
  draw() {
    if (!this.measureOptions.length) return;
    let unitWidth = this.innerWidth / this.weight;
    let moveEndLine = false;
    if (this.endLine && this.weight < 80) {
      unitWidth = 5;
      moveEndLine = true;
    }
    let totalX = this.innerX;
    const measureCountOffset = 10;

    if (SNConfig.score.showChordLine) {
      const x = this.innerX - 5;
      const y1 = this.innerY + SNConfig.score.chordHeight + 10;
      const y2 = this.innerY + this.innerHeight;
      const xOffset = 5;
      const yOffset = 5;
      const lineWeight = 2;
      this.el.appendChild(
        SvgUtils.createPath({
          d: `M ${x} ${y1}
          L ${x - xOffset} ${y1 + yOffset}
          V ${y2 - yOffset}
          L ${x} ${y2}
          L ${x - xOffset + lineWeight} ${y2 - yOffset}
          V ${y1 + yOffset}`,
          stroke: 'none',
          strokeWidth: 0,
          fill: 'black',
        }),
      );
    }

    this.measureOptions.forEach((option, index) => {
      option.x = totalX + SNStave.BAR_LINE_WIDTH;
      option.width = unitWidth * option.weight - 2 * SNStave.BAR_LINE_WIDTH;
      const measure = new SNMeasure(this, option);
      this.measures.push(measure);
      let lineTop = measure.y + SNConfig.score.chordHeight + measureCountOffset;
      let lineBottom = lineTop + SNConfig.score.lineHeight - measureCountOffset;
      const x = measure.x - SNStave.BAR_LINE_WIDTH;
      totalX += option.width + 2 * SNStave.BAR_LINE_WIDTH;

      if (measure.options?.repeatStart) {
        this.drawRepeatStartLine(x, lineTop, lineBottom);
      } else {
        this.drawBarLine(x, lineTop, lineBottom);
      }

      if (measure.options?.repeatEnd) {
        const x = measure.x + measure.width + SNStave.BAR_LINE_WIDTH;
        this.drawRepeatEndLine(x, lineTop, lineBottom);
      }

      if (index === this.measureOptions.length - 1 && !option.repeatEnd) {
        this.drawMeasureEndLine(
          moveEndLine ? totalX - measure.weight : this.innerWidth,
        );
      }

      // TODO：左手启用时，临时再绘制一份小节线，后续完善
      if (SNConfig.score.showChordLine) {
        lineTop += SNConfig.score.lyricHeight + SNConfig.score.chordLineHeight;
        lineBottom +=
          SNConfig.score.lyricHeight + SNConfig.score.chordLineHeight;

        if (measure.options?.repeatStart) {
          this.drawRepeatStartLine(x, lineTop, lineBottom);
        } else {
          this.drawBarLine(x, lineTop, lineBottom);
        }

        if (measure.options?.repeatEnd) {
          const x = measure.x + measure.width + SNStave.BAR_LINE_WIDTH;
          this.drawRepeatEndLine(x, lineTop, lineBottom);
        }

        if (index === this.measureOptions.length - 1 && !option.repeatEnd) {
          this.drawMeasureEndLine(
            moveEndLine ? totalX - measure.weight : this.innerWidth,
          );
        }
      }
    });
  }
}
