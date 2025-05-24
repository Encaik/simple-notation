import { SNBox } from '@core';
import { SNMeasure } from './measure';
import { SNBoxType, SNGraceNoteOptions, SNNoteOptions } from '@types';
import { SvgUtils, MusicSymbols } from '@utils';
import { SNConfig, SNRuntime } from '@config';
import { SNTieLineLayer } from '@layers';
import { SNChordLayer } from '@layers';

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

  /** 标记是否为连音的起始音符 */
  isTieStart: boolean;

  /** 标记是否为连音的结束音符 */
  isTieEnd: boolean;

  /** 音符在画布上的水平位置 */
  x: number;

  /** 音符的实际宽度（像素） */
  width: number;

  /** 装饰音列表 */
  graceNotes: SNGraceNoteOptions[];

  /**
   * 是否为时值错误音符（超出小节拍数时为true）
   */
  isError: boolean = false;

  /**
   * 该音符上方的和弦标记（如有）
   */
  chord?: string;

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
    super(
      measure,
      SNBoxType.NOTE,
      options.x,
      measure.innerY + SNConfig.score.chordHeight,
      options.width,
      measure.innerHeight - SNConfig.score.chordHeight,
      0,
    );
    this.index = options.index;
    this.noteData = options.noteData;
    this.weight = options.weight;
    this.note = options.note;
    this.startNote = options.startNote;
    this.endNote = options.endNote;
    this.underlineCount = options.underlineCount;
    this.upDownCount = options.upDownCount;
    this.octaveCount = options.octaveCount;
    this.isTieStart = options.isTieStart;
    this.isTieEnd = options.isTieEnd;
    this.graceNotes = options.graceNotes;
    this.x = options.x;
    this.width = options.width;
    this.isError = options.isError ?? false;
    this.chord = options.chord;
    this.el = SvgUtils.createG({
      tag: `note-${this.index}`,
    });
    measure.el.appendChild(this.el);
    this.drawBorderBox(SNBoxType.NOTE, SNConfig.debug.borderbox?.note);
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
      fontFamily:
        '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
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

  drawGraceNote() {
    // 绘制左下角四分之一圆弧
    const arcPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path',
    );
    const startX = this.innerX + 2;
    const startY = this.innerY + 20;
    const radius = 5;
    // 修改路径，绘制左下角四分之一圆弧
    const d = `M ${startX} ${startY} A ${radius} ${radius} 0 0 0 ${startX + radius} ${startY + radius}`;
    arcPath.setAttribute('d', d);
    arcPath.setAttribute('stroke', 'black');
    arcPath.setAttribute('fill', 'none');
    this.el.appendChild(arcPath);

    this.graceNotes.forEach((graceNote, index) => {
      const graceNoteX =
        startX - (this.graceNotes.length - 1) * 4 - radius / 2 + index * 8; // 调整每个装饰音的起始位置
      const graceNoteY = startY - radius / 2;

      // 绘制装饰音本身
      const text = SvgUtils.createText({
        x: graceNoteX,
        y: graceNoteY,
        text: graceNote.note,
        fontSize: 12,
        fontFamily:
          '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
        textAnchor: 'start',
        strokeWidth: 1,
      });
      this.el.appendChild(text);

      // 绘制装饰音的升降号
      if (graceNote.upDownCount) {
        const absCount = Math.abs(graceNote.upDownCount);
        let symbolKey: keyof typeof MusicSymbols.SYMBOLS;
        if (graceNote.upDownCount > 0) {
          if (absCount >= 2) {
            symbolKey = 'DOUBLE_SHARP';
          } else {
            symbolKey = 'SHARP';
          }
        } else if (graceNote.upDownCount < 0) {
          if (absCount >= 2) {
            symbolKey = 'DOUBLE_FLAT';
          } else {
            symbolKey = 'FLAT';
          }
        }
        const symbol = MusicSymbols.getSymbol(symbolKey!);
        const baseX = graceNoteX - 3; // 调整升降号的位置
        const baseY = graceNoteY - 5;
        const upDownText = SvgUtils.createText({
          x: baseX,
          y: baseY,
          text: symbol,
          fontSize: 10, // 调整字体大小
          fontFamily:
            '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
          textAnchor: 'start',
        });
        this.el.appendChild(upDownText);
      }

      // 绘制装饰音的八度升降点
      if (graceNote.octaveCount) {
        const absCount = Math.abs(graceNote.octaveCount);
        const isUp = graceNote.octaveCount > 0;
        const baseX = graceNoteX + 3; // 调整基准点的 x 坐标
        const baseY = isUp ? graceNoteY - 8 : graceNoteY + 8;

        for (let i = 0; i < absCount; i++) {
          const yOffset = isUp ? -i * 4 : i * 4;
          const circle = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'circle',
          );
          circle.setAttribute('cx', `${baseX}`);
          circle.setAttribute('cy', `${baseY + yOffset}`);
          circle.setAttribute('r', '1'); // 调整圆点大小
          circle.setAttribute('fill', 'black');
          this.el.appendChild(circle);
        }
      }

      // 绘制装饰音的下划线
      if (graceNote.underlineCount) {
        const y = graceNoteY + 3; // 调整下划线的 y 坐标
        const lineSpacing = 2;
        for (let i = 0; i < graceNote.underlineCount; i++) {
          const start = {
            x: graceNoteX,
            y: y + lineSpacing * i,
          };
          const end = {
            x: graceNoteX + 6, // 调整下划线的长度
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
          line.setAttribute('stroke-width', '0.5'); // 调整线宽
          this.el.appendChild(line);
        }
      }
    });
  }

  /**
   * 绘制完整的音符
   *
   * @description
   * 完整的音符渲染流程：
   * 1. 预留和弦/强弱符号渲染区域（chordHeight），可通过
   *    const chordY = this.innerY - (SNConfig.score.chordHeight ?? 10) + ((SNConfig.score.chordHeight ?? 10) / 2) + 2;
   *    // 在 chordY 位置渲染和弦/强弱符号（如有）
   * 2. 绘制升降号
   * 3. 绘制音符本身（数字或符号），如有时值错误则用红色
   * 4. 如果有时值线，绘制对应数量的下划线
   * 5. 如果有歌词且不是连音符（-），绘制歌词文本
   * 6. 绘制八度升降点
   * 7. 如果当前音符是连音结束音符，绘制连音线
   */
  draw() {
    // 渲染和弦（如有）
    if (this.chord) {
      SNChordLayer.addChord(this);
    }
    this.drawUpDownCount();
    this.drawOctaveCount();

    if (this.graceNotes.length > 0) {
      this.drawGraceNote(); // 修正调用方式
    }

    this.el.appendChild(
      SvgUtils.createText({
        x: this.innerX + this.innerWidth / 2,
        y: this.innerY + (SNConfig.score.lineHeight + 18) / 2,
        text: this.note,
        fontSize: 18,
        fontFamily:
          '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
        textAnchor: 'middle',
        strokeWidth: 1,
        stroke: this.isError ? 'red' : 'black',
      }),
    );
    if (this.underlineCount) {
      this.drawUnderLine(this.underlineCount);
    }
    if (this.isTieStart) {
      SNTieLineLayer.recordTieStart(this);
    }
    if (this.isTieEnd) {
      SNTieLineLayer.drawTieLineFromRecord(this);
    }
    if (SNRuntime.splitLyrics.length > 0) {
      if (this.index - 1 < SNRuntime.splitLyrics.length) {
        const word = SNRuntime.splitLyrics[this.index - 1];
        const baseX = this.innerX + this.innerWidth / 2;
        const baseY = this.innerY + SNConfig.score.lineHeight + 18;
        if (typeof word === 'string') {
          if (word === '-') return;
          const text = SvgUtils.createText({
            x: baseX,
            y: baseY,
            text: word,
            fontSize: 14,
            fontFamily:
              '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
            textAnchor: 'middle',
          });
          this.el.appendChild(text);
        } else if (Array.isArray(word)) {
          // 多行歌词，竖直向下分行绘制，行间距为15
          let drawIdx = 0;
          word.forEach((line) => {
            if (line === '-') return;
            const text = SvgUtils.createText({
              x: baseX,
              y: baseY + drawIdx * 15,
              text: line,
              fontSize: 14,
              fontFamily:
                '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
              textAnchor: 'middle',
            });
            this.el.appendChild(text);
            drawIdx++;
          });
        }
      }
    }
  }
}
