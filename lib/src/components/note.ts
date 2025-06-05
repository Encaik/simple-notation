import { SNBox } from '@core';
import { SNMeasure } from './measure';
import {
  SNBoxType,
  SNGraceNoteOptions,
  SNMusicSymbol,
  SNNoteOptions,
  SNScoreType,
} from '@types';
import { SvgUtils, BravuraMusicSymbols } from '@utils';
import { SNConfig, SNRuntime } from '@config';
import { SNTieLineLayer } from '@layers';
import { SNChordLayer } from '@layers';
import { SNPointerLayer } from '@layers';

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
    this.nodeTime = options.nodeTime;
    this.startNote = options.startNote;
    this.endNote = options.endNote;
    this.underlineCount = options.underlineCount;
    this.upDownCount = options.upDownCount;
    this.octaveCount = options.octaveCount;
    this.isTieStart = options.isTieStart;
    this.isTieEnd = options.isTieEnd;
    this.isTriplet = options.isTriplet ?? false;
    this.isTripletStart = options.tripletGroupStart ?? false;
    this.isTripletEnd = options.tripletGroupEnd ?? false;
    this.hasLeftBracket = options.hasLeftBracket ?? false;
    this.hasRightBracket = options.hasRightBracket ?? false;
    this.graceNotes = options.graceNotes;
    this.x = options.x;
    this.width = options.width;
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
  drawUpDownCount() {
    const absCount = Math.abs(this.upDownCount);
    let symbolKey: SNMusicSymbol;
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
    const offset = 2;
    const baseX = this.innerX + offset;
    const baseY = this.innerY + (SNConfig.score.lineHeight + 18) / 2 - 10;
    const text = BravuraMusicSymbols.createSymbol(symbolKey, {
      x: baseX,
      y: baseY,
      fontSize: 16,
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
        let symbolKey: keyof typeof BravuraMusicSymbols.SYMBOLS | undefined;
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
        // 调整升降号的位置
        const baseX = graceNoteX - 3;
        const baseY = graceNoteY - 5;
        // 创建升降号符号
        const upDownText = BravuraMusicSymbols.createSymbol(symbolKey!, {
          x: baseX,
          y: baseY,
          fontSize: 12,
        });
        // 将升降号添加到元素中
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
   * 获取音符在吉他流行谱上显示的位置和数字
   * @returns 一个对象，包含 x 坐标、弦号 (string) 和品位 (fret)，如果找不到位置则 fret 为 null
   * @description
   * 根据简谱音符、八度和升降号计算其在吉他指板上的弦和品位。
   * 遵循吉他记谱通常高一个八度的约定（实际发音低一个八度），并将输入的 MIDI 值减去 12。
   * 优先选择低把位的品（0-`preferredMaxFret`）。如果低把位没有找到，则在整个指板范围内查找。
   */
  getGuitarNotePosition() {
    const x = this.innerX + this.innerWidth / 2;
    const noteValue = this.note;
    const octave = this.octaveCount;
    const accidental = this.upDownCount;

    let string: number | null = null; // 弦号 (1-6)
    let fret: number | null = null; // 品位

    // 定义简谱音符 1-7 的基本 MIDI 值 (假设 1 是 C4, MIDI 60)
    const baseMidiNotes: { [key: string]: number } = {
      '1': 60, // C4
      '2': 62, // D4
      '3': 64, // E4
      '4': 65, // F4
      '5': 67, // G4
      '6': 69, // A4
      '7': 71, // B4
      '0': -1, // Rest note, no position
    };

    const baseMidi = baseMidiNotes[noteValue.replace('.', '')];

    if (baseMidi === undefined || baseMidi === -1) {
      return { x, string: null, fret: null };
    }

    // 根据八度和升降号计算目标 MIDI 音符
    const targetMidi = baseMidi + octave * 12 + accidental;

    // 根据吉他记谱实际发音低一个八度的约定，将目标 MIDI 值减去 12
    const actualSoundingMidi = targetMidi - 12;

    // 定义标准吉他调弦的 MIDI 音符 (E2 A2 D3 G3 B3 E4)
    const guitarTuning: number[] = [40, 45, 50, 55, 59, 64]; // MIDI 值

    const maxFret = 17; // 最大查找品位
    const preferredMaxFret = 3; // 优先查找的最高品位 (例如 0-5 品)

    // 首先，尝试在优先的品位范围内查找位置
    for (let s = 0; s < guitarTuning.length; s++) {
      const openStringMidi = guitarTuning[s];
      for (let f = 0; f <= preferredMaxFret && f <= maxFret; f++) {
        const fretMidi = openStringMidi + f;
        if (fretMidi === actualSoundingMidi) {
          // 在优先范围内找到音符位置
          string = 6 - s; // 吉他弦号通常从细到粗为 1-6
          fret = f;
          // 返回找到的第一个优先位置 (先低弦，后低品)
          return { x, string, fret };
        }
      }
    }

    // 如果在优先范围内没有找到，则在整个指板范围内查找
    for (let s = 0; s < guitarTuning.length; s++) {
      const openStringMidi = guitarTuning[s];
      for (let f = preferredMaxFret + 1; f <= maxFret; f++) {
        const fretMidi = openStringMidi + f;
        if (fretMidi === actualSoundingMidi) {
          // 在整个指板范围内找到音符位置
          string = 6 - s;
          fret = f;
          // 返回找到的第一个非优先位置
          return { x, string, fret };
        }
      }
    }
    // 如果在最大品位范围内都没有找到音符位置
    return { x, string: null, fret: null };
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
    this.drawUpDownCount();
    this.drawOctaveCount();
    if (this.graceNotes.length > 0) {
      this.drawGraceNote(); // 修正调用方式
    }
    this.drawBrackets();
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
  }

  drawGuitarNote() {
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

    this.drawGuitarRestNote(lineTop, lineHeight);

    const { x, string, fret } = this.getGuitarNotePosition();

    // 只有找到品位信息时才绘制品位数字和竖线
    if (string !== null && fret !== null) {
      const lineIndex = string - 1;
      const textY = lineTop + lineHeight * lineIndex + lineHeight / 2; // 根据弦号计算基础 Y 坐标并进行微调

      const text = SvgUtils.createText({
        x: x, // 使用计算出的水平中心位置
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
      if (this.noteData.includes('.')) {
        const dot = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle',
        );
        dot.setAttribute('cx', `${x + 5}`); // 右下角偏移
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
              x: this.innerX + this.innerWidth / 2,
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
        case '0':
          // TODO：根据时值绘制休止符
          break;
        default:
          break;
      }
    }
  }

  drawGuitarRestNote(lineTop: number, lineHeight: number) {
    // 如果是休止符，绘制对应的休止符符号并跳过后续绘制（不依赖string）
    if (this.note === '0') {
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
      return; // 跳过当前休止符的后续绘制（竖线和符尾）
    }
  }

  draw() {
    if (this.chord?.length) {
      SNChordLayer.addChord(this);
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
