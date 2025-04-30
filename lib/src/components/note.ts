import { SNBox } from '@core';
import { SNMeasure } from './measure';
import { SNNoteOptions } from '@types';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';
import { SNRuntime } from '../config/runtime';
import { MusicSymbols } from '../utils/music-symbols';

/**
 * SNNote 类 - 简谱音符渲染组件
 *
 * @class SNNote
 * @extends {SNBox}
 * @description
 * 这个类负责渲染简谱中的单个音符，包括音符本身、时值线（下划线）
 * 和对应的歌词（如果有）。支持以下音符类型：
 * - 1    四分音符
 * - 1/8  八分音符
 * - 1/16 十六分音符
 * - 1/32 三十二分音符
 * - 1/2  二分音符
 * - 1/0  全音符
 */
export class SNNote extends SNBox {
  /** SVG group 元素，作为音符的容器 */
  el: SVGGElement;

  /** 当前音符的序号（从1开始） */
  index: number;

  /** 音符的原始数据字符串 */
  noteData: string;

  /** 音符的权重（用于计算宽度） */
  weight: number;

  /** 音符的实际内容（数字或符号） */
  note: string;

  /** 标记是否为小节起始音符 */
  startNote: boolean;

  /** 标记是否为小节结束音符 */
  endNote: boolean;

  /** 音符下方的下划线数量（表示时值） */
  underlineCount: number;

  /** 音符上方的升降号数量 */
  upDownCount: number;

  /** 音符的八度升降数量 */
  octaveCount: number;

  /** 音符在画布上的水平位置 */
  x: number;

  /** 音符的实际宽度（像素） */
  width: number;

  /**
   * 创建一个新的音符实例
   *
   * @param measure - 父级小节组件
   * @param options - 音符的配置选项
   * @description
   * 构造函数会：
   * 1. 初始化音符的位置和大小
   * 2. 设置基本属性（序号、内容等）
   * 3. 创建 SVG group 元素
   * 4. 绘制调试边界框（如果启用）
   * 5. 开始渲染音符内容
   */
  constructor(measure: SNMeasure, options: SNNoteOptions) {
    super(options.x, measure.innerY, options.width, measure.innerHeight, 0);
    this.index = options.index;
    this.noteData = options.noteData;
    this.weight = options.weight;
    this.note = options.note;
    this.startNote = options.startNote;
    this.endNote = options.endNote;
    this.underlineCount = options.underlineCount;
    this.upDownCount = options.upDownCount;
    this.octaveCount = options.octaveCount;
    this.x = options.x;
    this.width = options.width;
    this.el = SvgUtils.createG({
      tag: `note-${this.index}`,
    });
    measure.el.appendChild(this.el);
    this.drawBorderBox(this.el, SNConfig.debug.borderbox?.note);
    this.draw();
  }

  /**
   * 绘制音符下方的时值线
   *
   * @param times - 需要绘制的下划线数量
   * @description
   * 根据音符的时值绘制对应数量的下划线：
   * - 1条：八分音符
   * - 2条：十六分音符
   * - 3条：三十二分音符
   * 下划线会根据音符在小节中的位置（起始/结束）自动调整长度。
   */
  drawUnderLine(times: number) {
    // 调整起始 y 坐标，降低下划线位置
    const y = this.innerY + SNConfig.score.lineHeight - 14;
    // 减小每次循环的偏移量，降低下划线间距
    const lineSpacing = 3;
    for (let i = 0; i < times; i++) {
      const start = {
        x: this.innerX + (this.startNote ? 3 : 0),
        y: y + lineSpacing * i,
      };
      const end = {
        x: this.innerX - (this.endNote ? 3 : 0) + this.innerWidth,
        y: y + lineSpacing * i,
      };
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      line.setAttribute('x1', `${start.x}`);
      line.setAttribute('y1', `${start.y}`);
      line.setAttribute('x2', `${end.x}`);
      line.setAttribute('y2', `${end.y}`);
      line.setAttribute('stroke', 'black');
      line.setAttribute('stroke-width', '1');
      this.el.appendChild(line);
    }
  }

  /**
   * 绘制音符的升降号
   *
   * @description
   * 根据 upDownCount 的值，在音符左上角绘制相应数量的升号（#）或降号（b）。
   * 正数绘制升号，负数绘制降号。当有多个升降号时，使用重升号和重降号。
   */
  drawUpDownCount() {
    const absCount = Math.abs(this.upDownCount);
    let symbolKey: keyof typeof MusicSymbols.SYMBOLS;
    if (this.upDownCount > 0) {
      if (absCount >= 2) {
        symbolKey = 'DOUBLE_SHARP';
      } else {
        symbolKey = 'SHARP';
      }
    } else if (this.upDownCount < 0) {
      if (absCount >= 2) {
        symbolKey = 'DOUBLE_FLAT';
      } else {
        symbolKey = 'FLAT';
      }
    } else {
      return;
    }

    const symbol = MusicSymbols.getSymbol(symbolKey);
    // 增加偏移量，让升降号更贴近音符
    const offset = 2;
    const baseX = this.innerX + offset;
    const baseY = this.innerY + (SNConfig.score.lineHeight + 18) / 2 - 10;
    const text = SvgUtils.createText({
      x: baseX,
      y: baseY,
      text: symbol,
      fontSize: 16,
      fontFamily: 'Bravura',
      textAnchor: 'start',
    });
    this.el.appendChild(text);
  }

  /**
   * 绘制音符的八度升降点
   *
   * @description
   * 根据 octaveCount 的值，在音符正上方或正下方绘制相应数量的点。
   * 正数在上方绘制，负数在下方绘制。
   */
  drawOctaveCount() {
    const absCount = Math.abs(this.octaveCount);
    const isUp = this.octaveCount > 0;
    const baseX = this.innerX + this.innerWidth / 2;
    const baseY = isUp
      ? this.innerY + (SNConfig.score.lineHeight + 18) / 2 - 20
      : this.innerY + (SNConfig.score.lineHeight + 18) / 2 + 10;

    for (let i = 0; i < absCount; i++) {
      const yOffset = isUp ? -i * 5 : i * 5;
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
      );
      circle.setAttribute('cx', `${baseX}`);
      circle.setAttribute('cy', `${baseY + yOffset}`);
      circle.setAttribute('r', '2');
      circle.setAttribute('fill', 'black');
      this.el.appendChild(circle);
    }
  }

  /**
   * 绘制完整的音符
   *
   * @description
   * 完整的音符渲染流程：
   * 1. 绘制升降号
   * 2. 绘制音符本身（数字或符号）
   * 3. 如果有时值线，绘制对应数量的下划线
   * 4. 如果有歌词且不是连音符（-），绘制歌词文本
   * 5. 绘制八度升降点
   */
  draw() {
    this.drawUpDownCount();
    this.drawOctaveCount();
    this.el.appendChild(
      SvgUtils.createText({
        x: this.innerX + this.innerWidth / 2,
        y: this.innerY + (SNConfig.score.lineHeight + 18) / 2,
        text: this.note,
        fontSize: 18,
        fontFamily: 'simsun',
        textAnchor: 'middle',
        strokeWidth: 1,
      }),
    );
    if (this.underlineCount) {
      this.drawUnderLine(this.underlineCount);
    }
    if (SNRuntime.splitLyrics.length > 0) {
      if (this.index - 1 < SNRuntime.splitLyrics.length) {
        const word = SNRuntime.splitLyrics[this.index - 1];
        if (word === '-') return;
        const text = SvgUtils.createText({
          x: this.innerX + this.innerWidth / 2,
          y: this.innerY + SNConfig.score.lineHeight + 18,
          text: word,
          fontSize: 14,
          fontFamily: 'simsun',
          textAnchor: 'middle',
        });
        this.el.appendChild(text);
      }
    }
  }
}
