import { SNBox } from '@core';
import { SNBoxType, SNMeasureOptions, SNNoteOptions } from '@types';
import { SNNote } from './note';
import { SNStave } from './stave';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';

/**
 * SNMeasure 类 - 简谱小节渲染组件
 *
 * @class SNMeasure
 * @extends {SNBox}
 * @description
 * 这个类负责渲染简谱中的一个小节，包括小节序号和所有音符。
 * 它会根据权重自动计算每个音符的位置和宽度，确保音符间距
 * 的合理性。
 */
export class SNMeasure extends SNBox {
  /** SVG group 元素，作为小节的容器 */
  el: SVGGElement;

  /** 当前小节的序号（从1开始） */
  index: number;

  /** 小节的原始数据字符串 */
  measureData: string;

  /** 小节的总权重（用于计算宽度） */
  weight: number;

  /** 小节中所有音符的配置选项 */
  noteOptions: SNNoteOptions[];

  /** 小节中所有音符的实例 */
  notes: SNNote[] = [];

  /** 小节在画布上的水平位置 */
  x: number;

  /** 小节的实际宽度（像素） */
  width: number;

  /**
   * 创建一个新的小节实例
   *
   * @param stave - 父级乐句组件
   * @param options - 小节的配置选项
   * @description
   * 构造函数会：
   * 1. 初始化小节的位置和大小
   * 2. 设置基本属性（序号、数据等）
   * 3. 创建 SVG group 元素
   * 4. 绘制调试边界框（如果启用）
   * 5. 开始渲染小节内容
   */
  constructor(stave: SNStave, options: SNMeasureOptions) {
    super(
      stave,
      SNBoxType.MEASURE,
      options.x,
      stave.innerY,
      options.width,
      stave.innerHeight,
      [5, 0],
    );
    this.index = options.index;
    this.measureData = options.measureData;
    this.weight = options.weight;
    this.noteOptions = options.noteOptions;
    this.x = options.x;
    this.width = options.width;
    this.el = SvgUtils.createG({
      tag: `measure-${this.index}`,
    });
    stave.el.appendChild(this.el);
    this.drawBorderBox(SNBoxType.MEASURE, SNConfig.debug.borderbox?.measure);
    this.draw();
  }

  /**
   * 绘制小节序号
   *
   * @description
   * 在小节的左上角绘制小节序号，用于标识小节的顺序。
   * 序号使用小号字体显示，避免干扰谱面的主要内容。
   */
  drawCount() {
    const yOffset = SNConfig.score.chordHeight;
    this.el.appendChild(
      SvgUtils.createText({
        text: `${this.index + 1}`,
        x: this.x,
        y: this.y + yOffset + 8,
        fontSize: 10,
        fontFamily: 'sans-serif',
        textAnchor: 'middle',
      }),
    );
  }

  /**
   * 绘制完整的小节
   *
   * @description
   * 完整的小节渲染流程：
   * 1. 绘制小节序号
   * 2. 计算单位宽度（每个权重对应的像素值）
   * 3. 遍历所有音符配置
   * 4. 计算每个音符的位置和宽度
   * 5. 创建并渲染音符
   */
  draw() {
    this.drawCount();
    const unitWidth = this.innerWidth / this.weight;
    let totalX = this.innerX;
    this.noteOptions.forEach((option) => {
      option.x = totalX;
      option.width = unitWidth * option.weight;
      const note = new SNNote(this, option);
      this.notes.push(note);
      totalX += option.width;
    });
  }
}
