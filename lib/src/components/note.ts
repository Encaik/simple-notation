import { SNBox } from '@core';
import { SNMeasure } from './measure';
import {
  SNBoxType,
  SNGraceNoteOptions,
  SNMultiNoteOptions,
  SNMusicSymbol,
  SNNoteOptions,
  SNScoreType,
} from '@types';
import { SvgUtils, BravuraMusicSymbols, SNTransition } from '@utils';
import { SNConfig, SNRuntime } from '@config';
import { SNTieLineLayer } from '@layers';
import { SNChordLayer } from '@layers';
import { SNPointerLayer } from '@layers';
import { getPianoNotesForChord } from '@utils';

/**
 * SNNote 类 - 简谱音符渲染组件
 *
 * @class SNNote
 * @extends {SNBox}
 * @description
 * 这个类负责渲染简谱中的单个音符，包括音符本身、时值线（下划线）
 * 和对应的歌词（如果有）。
 *
 * │<    lineWeight    >│
 * ┌────────────────────┐
 * │chordHeight         │
 * ├────────────────────┤
 * │lineHeight          │
 * ├────────────────────┤
 * │lyricHeight         │
 * ├────────────────────┤
 * │chordLineHeight     │
 * └────────────────────┘
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

  /** 音符的实际时值 */
  nodeTime: number;

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

  /** 是否附点音符 */
  isDelay: boolean;

  /** 标记是否为连音的起始音符 */
  isTieStart: boolean;

  /** 标记是否为连音的结束音符 */
  isTieEnd: boolean;

  /** 标记是否为三连音音符 */
  isTriplet: boolean;

  /** 标记是否为三连音的起始音符 */
  isTripletStart: boolean;

  /** 标记是否为三连音的结束音符 */
  isTripletEnd: boolean;

  /** 音符在画布上的水平位置 */
  x: number;

  /** 音符的实际宽度（像素） */
  width: number;

  /** 装饰音列表 */
  graceNotes: SNGraceNoteOptions[];

  /** 多音符列表 */
  multiNotes: SNMultiNoteOptions[];

  /**
   * 是否为时值错误音符（超出小节拍数时为true）
   */
  isError: boolean = false;

  /**
   * 该音符上方的和弦标记（如有）
   */
  chord?: string[];

  /** 音符在原始文本中的起始位置 */
  startPosition?: number;

  /** 音符在原始文本中的结束位置 */
  endPosition?: number;

  /** 是否有左括号 */
  hasLeftBracket?: boolean;

  /** 是否有右括号 */
  hasRightBracket?: boolean;

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
      options.x!,
      measure.innerY + SNConfig.score.chordHeight,
      options.width!,
      measure.innerHeight - SNConfig.score.chordHeight,
      0,
    );
    this.index = options.index!;
    this.noteData = options.noteData;
    this.weight = options.weight;
    this.note = options.note;
    this.nodeTime = options.nodeTime;
    this.startNote = options.startNote!;
    this.endNote = options.endNote!;
    this.underlineCount = options.underlineCount;
    this.upDownCount = options.upDownCount;
    this.octaveCount = options.octaveCount;
    this.isDelay = options.isDelay;
    this.isTieStart = options.isTieStart;
    this.isTieEnd = options.isTieEnd;
    this.isTriplet = options.isTriplet ?? false;
    this.isTripletStart = options.tripletGroupStart ?? false;
    this.isTripletEnd = options.tripletGroupEnd ?? false;
    this.hasLeftBracket = options.hasLeftBracket ?? false;
    this.hasRightBracket = options.hasRightBracket ?? false;
    this.graceNotes = options.graceNotes;
    this.multiNotes = options.multiNotes;
    this.x = options.x!;
    this.width = options.width!;
    this.isError = options.isError ?? false;
    this.chord = options.chord;
    this.startPosition = options.startPosition;
    this.endPosition = options.endPosition;
    this.el = SvgUtils.createG({
      tag: `note-${this.index}`,
    });
    measure.el.appendChild(this.el);
    this.drawBorderBox(
      SNBoxType.NOTE,
      SNConfig.debug.borderbox?.note,
      this.index,
    );
    this.draw();
    SNPointerLayer.createNoteRect(this);
  }

  /**
   * 获取音符在原始文本中的范围
   * @returns [start, end] 元组，表示音符在原始文本中的起始和结束位置
   */
  getTextRange(): [number | undefined, number | undefined] {
    return [this.startPosition, this.endPosition];
  }

  /**
   * 绘制音符的升降号
   *
   * @description
   * 根据 upDownCount 的值，在音符左上角绘制相应数量的升号（#）或降号（b）。
   * 正数绘制升号，负数绘制降号。当有多个升降号时，使用重升号和重降号。
   */
  drawUpDownCount(options: {
    x: number;
    y: number;
    offset?: number;
    count?: number;
    fontSize?: number;
    fontHeight?: number;
  }) {
    const {
      x,
      y,
      offset = 10,
      count = this.upDownCount,
      fontSize = 12,
      fontHeight = 10,
    } = options;
    const absCount = Math.abs(count);
    let symbolKey: SNMusicSymbol | undefined;
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
    const baseX = x - offset;
    const baseY = y - fontHeight;
    if (symbolKey) {
      const text = BravuraMusicSymbols.createSymbol(symbolKey, {
        x: baseX,
        y: baseY,
        fontSize,
      });
      this.el.appendChild(text);
    }
  }

  /**
   * 绘制音符的八度升降点
   *
   * @description
   * 根据 octaveCount 的值，在音符正上方或正下方绘制相应数量的点。
   * 正数在上方绘制，负数在下方绘制。
   */
  drawOctaveCount(options: {
    x: number;
    y: number;
    count?: number;
    r?: number;
    gap?: number;
    fontHeight?: number;
  }) {
    const {
      x,
      y,
      count = this.octaveCount,
      r = 1.5,
      gap = 5,
      fontHeight = 10,
    } = options;
    const absCount = Math.abs(count);
    const isUp = count > 0;
    const baseX = x;
    const baseY = y + (isUp ? -fontHeight - 10 : 10);

    for (let i = 0; i < absCount; i++) {
      const yOffset = isUp ? -i * gap : i * gap;
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
      );
      circle.setAttribute('cx', `${baseX}`);
      circle.setAttribute('cy', `${baseY + yOffset}`);
      circle.setAttribute('r', `${r}`);
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
    const startX = this.innerX - 2;
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
        this.drawUpDownCount({
          x: graceNoteX,
          y: graceNoteY,
          offset: 4,
          count: graceNote.upDownCount,
          fontSize: 9,
          fontHeight: 5,
        });
      }

      // 绘制装饰音的八度升降点
      if (graceNote.octaveCount) {
        this.drawOctaveCount({
          x: graceNoteX + 3,
          y: graceNoteY,
          count: graceNote.octaveCount,
          r: 1,
          gap: 4,
          fontHeight: 1.5,
        });
      }

      // 绘制装饰音的下划线
      if (graceNote.underlineCount) {
        const y = graceNoteY + 3; // 调整下划线的 y 坐标
        const lineSpacing = 2;
        for (let i = 0; i < graceNote.underlineCount; i++) {
          this.el.appendChild(
            SvgUtils.createLine({
              x1: graceNoteX,
              y1: y + lineSpacing * i,
              x2: graceNoteX + 6,
              y2: y + lineSpacing * i,
              stroke: 'black',
              strokeWidth: 0.5,
            }),
          );
        }
      }
    });
  }

  /**
   * 绘制左右括号
   *
   * @description
   * 根据 hasLeftBracket 和 hasRightBracket 字段，在音符左右两侧绘制括号，避免与音符本体重叠。
   */
  drawBrackets() {
    const fontSize = 18;
    const baseY = this.innerY + (SNConfig.score.lineHeight + 18) / 2;
    // 左括号
    if (this.hasLeftBracket) {
      this.el.appendChild(
        SvgUtils.createText({
          x: this.innerX + this.innerWidth / 2 - fontSize * 0.8,
          y: baseY,
          text: '(',
          fontSize,
          fontFamily:
            '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
          textAnchor: 'middle',
          strokeWidth: 1,
        }),
      );
    }
    // 右括号
    if (this.hasRightBracket) {
      this.el.appendChild(
        SvgUtils.createText({
          x: this.innerX + this.innerWidth / 2 + fontSize * 0.8,
          y: baseY,
          text: ')',
          fontSize,
          fontFamily:
            '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
          textAnchor: 'middle',
          strokeWidth: 1,
        }),
      );
    }
  }

  drawSimpleNote() {
    const baseX = this.innerX + this.innerWidth / 2;
    const baseY = this.innerY + (SNConfig.score.lineHeight + 18) / 2;
    this.drawBrackets();
    if (this.graceNotes.length > 0) {
      this.drawGraceNote();
    }
    if (this.multiNotes.length > 0) {
      this.drawOctaveCount({
        x: baseX,
        y: baseY,
        r: 1.2,
        gap: 4,
        fontHeight: 1.5,
      });
      this.drawUpDownCount({
        x: baseX,
        y: baseY,
        offset: 7,
        fontSize: 10,
        fontHeight: 6,
      });
      this.el.appendChild(
        SvgUtils.createText({
          x: baseX,
          y: baseY,
          text: this.note,
          fontSize: 12,
          fontFamily:
            '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
          textAnchor: 'middle',
          strokeWidth: 1,
          stroke: this.isError ? 'red' : 'black',
        }),
      );
      this.multiNotes.forEach((multiNote, index) => {
        const noteY = baseY - (index + 1) * 18;
        this.drawOctaveCount({
          x: baseX,
          y: noteY,
          count: multiNote.octaveCount,
          r: 1.2,
          gap: 4,
          fontHeight: 1.5,
        });
        this.drawUpDownCount({
          x: baseX,
          y: noteY,
          offset: 7,
          count: multiNote.upDownCount,
          fontSize: 10,
          fontHeight: 6,
        });
        this.el.appendChild(
          SvgUtils.createText({
            x: baseX,
            y: noteY,
            text: multiNote.note,
            fontSize: 12,
            fontFamily:
              '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
            textAnchor: 'middle',
            strokeWidth: 1,
            stroke: this.isError ? 'red' : 'black',
          }),
        );
      });
      if (this.isDelay) {
        this.el.appendChild(
          SvgUtils.createText({
            x: baseX + 10,
            y: baseY,
            text: '.',
            fontSize: 18,
            fontFamily:
              '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
            textAnchor: 'middle',
            strokeWidth: 1,
            stroke: this.isError ? 'red' : 'black',
          }),
        );
      }
    } else {
      this.drawUpDownCount({ x: baseX, y: baseY });
      this.drawOctaveCount({ x: baseX, y: baseY });
      this.el.appendChild(
        SvgUtils.createText({
          x: baseX,
          y: baseY,
          text: this.note,
          fontSize: 18,
          fontFamily:
            '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
          textAnchor: 'middle',
          strokeWidth: 1,
          stroke: this.isError ? 'red' : 'black',
        }),
      );
      if (this.isDelay) {
        this.el.appendChild(
          SvgUtils.createText({
            x: baseX + 10,
            y: baseY,
            text: '.',
            fontSize: 18,
            fontFamily:
              '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
            textAnchor: 'middle',
            strokeWidth: 1,
            stroke: this.isError ? 'red' : 'black',
          }),
        );
      }
    }
    // 绘制左手和弦逻辑
    if (SNConfig.score.showChordLine && this.chord && this.chord.length > 0) {
      const chordFontSize = 14; // 和弦音符字体略小
      const verticalSpacing = 16; // 多个和弦音符之间的垂直间距
      const startY =
        this.innerY +
        SNConfig.score.lineHeight +
        SNConfig.score.lyricHeight +
        SNConfig.score.lineSpace; // 和弦行区域的起始 Y 坐标

      // 获取和弦对应的钢琴音高列表
      // 假设 chord 数组的第一个元素是主和弦符号，获取所有音高
      const pianoNoteNames = getPianoNotesForChord(this.chord[0]);

      if (pianoNoteNames.length > 0) {
        // 计算所有音符的总体高度，以便垂直居中
        // 注意：这里需要考虑升降号和八度点的高度，但为了简化，先按字体大小和行间距估算
        const estimatedNoteHeight = 16 * 1.5; // 估算一个音符加升降号/八度点的高度
        const totalEstimatedHeight =
          pianoNoteNames.length > 1
            ? (pianoNoteNames.length - 1) * verticalSpacing +
              estimatedNoteHeight
            : estimatedNoteHeight;

        // 计算第一个音符的绘制起始 Y 坐标，使其垂直居中于和弦行区域
        const firstNoteDrawY =
          startY +
          (SNConfig.score.chordLineHeight - totalEstimatedHeight) / 2 +
          estimatedNoteHeight * 0.6; // 在和弦行中垂直居中，并考虑文本基线

        pianoNoteNames.forEach((chordNoteName: string, idx: number) => {
          this.el.appendChild(
            SvgUtils.createText({
              x: this.innerX + this.innerWidth / 2,
              y: firstNoteDrawY + idx * verticalSpacing,
              text: chordNoteName,
              fontSize: chordFontSize,
              fontFamily:
                '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
              textAnchor: 'middle',
              strokeWidth: 1,
              stroke: this.isError ? 'red' : 'black',
            }),
          );
        });
      }
    }
  }

  drawGuitarNote() {
    const baseX = this.innerX + this.innerWidth / 2;
    const lineTop = this.parent!.y + SNConfig.score.chordHeight + 11;
    const lineHeight = (SNConfig.score.lineHeight - 4) / 6;

    // 绘制吉他六线谱的六条线
    for (let i = 0; i < 6; i++) {
      const y = lineTop + lineHeight * i;
      const line = SvgUtils.createLine({
        x1: this.innerX,
        y1: y,
        x2: this.innerX + this.innerWidth,
        y2: y,
        stroke: 'black',
        strokeWidth: 1,
      });
      this.el.appendChild(line);
    }

    if (this.note === '0') {
      this.drawGuitarRestNote(lineTop, lineHeight);
      return;
    }

    const { string, fret } = SNTransition.Guitar.getSimpleNoteGuitarPosition(
      this.note,
      this.octaveCount,
      this.upDownCount,
    );

    // 只有找到品位信息时才绘制品位数字和竖线
    if (string !== null && fret !== null) {
      const lineIndex = string - 1;
      const textY = lineTop + lineHeight * lineIndex + lineHeight / 2; // 根据弦号计算基础 Y 坐标并进行微调

      const text = SvgUtils.createText({
        x: baseX, // 使用计算出的水平中心位置
        y: textY, // 使用根据弦计算出的垂直位置
        text: fret.toString(), // 显示品位数字
        fontSize: 12,
        textAnchor: 'middle',
        fill: this.isError ? 'red' : 'black',
        strokeWidth: 2,
        stroke: 'white',
      });
      text.style.paintOrder = 'stroke';
      this.el.appendChild(text);

      // 附点音符：在数字右下角绘制小圆点
      if (this.isDelay) {
        const dot = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle',
        );
        dot.setAttribute('cx', `${baseX + 5}`); // 右下角偏移
        dot.setAttribute('cy', `${textY}`);
        dot.setAttribute('r', '1');
        dot.setAttribute('fill', 'black');
        this.el.appendChild(dot);
      }
    } else {
      switch (this.note) {
        case '-':
          this.el.appendChild(
            SvgUtils.createText({
              x: baseX,
              y: lineTop + lineHeight * 3 + lineHeight / 3,
              text: '-',
              fontSize: 18,
              fontFamily:
                '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
              textAnchor: 'middle',
              strokeWidth: 1,
              stroke: 'black',
            }),
          );
          break;
        default:
          break;
      }
    }

    if (this.multiNotes.length > 0) {
      this.multiNotes.forEach((multiNote) => {
        const { string, fret } =
          SNTransition.Guitar.getSimpleNoteGuitarPosition(
            multiNote.note,
            multiNote.octaveCount,
            multiNote.upDownCount,
          );
        if (string !== null && fret !== null) {
          const lineIndex = string - 1;
          const textY = lineTop + lineHeight * lineIndex + lineHeight / 2; // 根据弦号计算基础 Y 坐标并进行微调

          const text = SvgUtils.createText({
            x: baseX, // 使用计算出的水平中心位置
            y: textY, // 使用根据弦计算出的垂直位置
            text: fret.toString(), // 显示品位数字
            fontSize: 12,
            textAnchor: 'middle',
            fill: this.isError ? 'red' : 'black',
            strokeWidth: 2,
            stroke: 'white',
          });
          text.style.paintOrder = 'stroke';
          this.el.appendChild(text);
        }
      });
    }
  }

  drawGuitarRestNote(lineTop: number, lineHeight: number) {
    let restSymbolKey: keyof typeof BravuraMusicSymbols.SYMBOLS | undefined;
    // 根据nodeTime选择休止符符号
    switch (this.nodeTime) {
      case 4: // 全休止符
        restSymbolKey = 'REST_WHOLE';
        break;
      case 2: // 二分休止符
        restSymbolKey = 'REST_HALF';
        break;
      case 1: // 四分休止符
        restSymbolKey = 'REST_QUARTER';
        break;
      case 0.5: // 八分休止符
        restSymbolKey = 'REST_EIGHTH';
        break;
      case 0.25: // 十六分休止符
        restSymbolKey = 'REST_SIXTEENTH';
        break;
      case 0.125: // 三十二分休止符
        restSymbolKey = 'REST_32ND';
        break;
      default:
        // 默认四分休止符
        restSymbolKey = 'REST_QUARTER';
        break;
    }
    if (restSymbolKey) {
      const x = this.innerX + this.innerWidth / 2; // 获取音符的中心x坐标
      // 绘制休止符符号，位置需要微调
      this.el.appendChild(
        BravuraMusicSymbols.createSymbol(restSymbolKey, {
          x: x, // 水平居中
          y: lineTop + lineHeight * 3, // 垂直位置，大约在六线谱中间位置
          fontSize: 24, // 适当放大
          fontFamily: 'Bravura', // 使用Bravura字体
          textAnchor: 'middle', // 水平居中对齐
        }),
      );
    }
  }

  draw() {
    if (this.chord?.length) {
      // 当存在和弦数据且显示和弦线时，由 drawSimpleNote 内部处理绘制，
      // 不需要在这里单独调用 SNChordLayer.addChord
      // 如果未来吉他谱也需要独立和弦层，可以在这里根据 scoreType 判断
      if (!SNConfig.score.showChordLine) {
        SNChordLayer.addChord(this);
      }
    }
    switch (SNConfig.score.scoreType) {
      case SNScoreType.Simple:
        this.drawSimpleNote();
        break;
      case SNScoreType.Guitar:
        this.drawGuitarNote();
        break;
      default:
        this.drawSimpleNote();
        break;
    }
    if (this.isTieStart) {
      SNTieLineLayer.recordTieStart(this);
    }
    if (this.isTieEnd) {
      SNTieLineLayer.drawTieLineFromRecord(this);
    }
    if (this.isTriplet && this.isTripletStart) {
      SNTieLineLayer.recordTripletStart(this);
    }
    if (this.isTriplet && this.isTripletEnd) {
      SNTieLineLayer.drawTripletBeamByRecord(this);
    }
    if (SNRuntime.splitLyrics.length > 0) {
      if (this.index - 1 < SNRuntime.splitLyrics.length) {
        const word = SNRuntime.splitLyrics[this.index - 1];
        const baseX = this.innerX + this.innerWidth / 2;
        const baseY =
          this.innerY +
          SNConfig.score.lineHeight +
          (SNConfig.score.scoreType === SNScoreType.Simple ? 18 : 38);
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
