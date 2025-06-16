import { SNNote } from '../components/note';
import { Logger, SvgUtils } from '@utils';
import { SNStave } from '../components/stave';
import { SNScore } from '../components/score';

export class SNTieLineLayer {
  static tieStartNotes: SNNote[] = [];
  static tripletStartNotes: SNNote[] = [];
  private static el: SVGGElement;

  constructor(scoreEl: SVGGElement) {
    Logger.debug('constructor 初始化连音线层', 'SNTieLineLayer');
    SNTieLineLayer.el = SvgUtils.createG({ tag: 'tieline' });
    scoreEl.appendChild(SNTieLineLayer.el);
  }

  /**
   * 记录连音的起始音符
   * @param note - 连音的起始音符
   */
  static recordTieStart(note: SNNote) {
    this.tieStartNotes.push(note);
  }

  /**
   * 记录三连音组的首音符
   * @param note - 三连音组的首音符
   */
  static recordTripletStart(note: SNNote) {
    this.tripletStartNotes.push(note);
  }

  /**
   * 绘制单条连音线（两端为四分之一圆弧，中间为直线，半径自适应，且不与音符重叠）
   * @param x1 - 起始x坐标
   * @param y1 - 起始y坐标
   * @param x2 - 结束x坐标
   * @param y2 - 结束y坐标
   * @param xDistance - x方向距离
   */
  private static drawSingleTieLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    xDistance: number,
  ) {
    const dynamicRadiusY = xDistance * 0.08;
    SNTieLineLayer.el.appendChild(
      SvgUtils.createArc({
        x1,
        y1,
        x2,
        y2,
        radiusX: xDistance / 2,
        radiusY: dynamicRadiusY,
        rotation: 0,
        largeArcFlag: false,
        sweepFlag: true,
        stroke: 'black',
        strokeWidth: 2,
      }),
    );
  }

  /**
   * 绘制连音线并移除已使用的起始音符记录
   * @param endNote - 连音的结束音符
   */
  static drawTieLineFromRecord(endNote: SNNote) {
    const startNote = this.tieStartNotes.pop();
    if (!startNote) return;

    // 获取起始音符和结束音符所在的乐句
    const startStave = startNote.parent?.parent as SNStave | undefined;
    const endStave = endNote.parent?.parent as SNStave | undefined;

    if (!startStave || !endStave) return;

    // 如果起始音符和结束音符在同一行
    if (startStave === endStave) {
      try {
        const xDistance = Math.abs(endNote.x - startNote.x);
        this.drawSingleTieLine(
          startNote.x + startNote.width / 2,
          startNote.y + 10,
          endNote.x + endNote.width / 2,
          endNote.y + 10,
          xDistance,
        );
        return;
      } catch (error) {
        Logger.error(
          `单行连音线绘制失败：${JSON.stringify(error)}`,
          'SNTieLineLayer',
        );
      }
    }

    // 跨行情况
    try {
      const startStaveIndex = startStave.index;
      const endStaveIndex = endStave.index;
      const score = startStave.parent as SNScore;
      const staves = score.staves;

      // 绘制从起始音符到第一行末尾的连音线
      const firstLineEndX = startStave.innerX + startStave.innerWidth + 10;
      const firstLineXDistance = Math.abs(
        firstLineEndX - (startNote.x + startNote.width / 2),
      );
      this.drawSingleTieLine(
        startNote.x + startNote.width / 2,
        startNote.y + 10,
        firstLineEndX,
        startNote.y + 10,
        firstLineXDistance,
      );

      // 绘制中间行的连音线
      for (let i = startStaveIndex; i < endStaveIndex - 1; i++) {
        const currentStave = staves[i];
        this.drawSingleTieLine(
          currentStave.innerX - 10,
          currentStave.y + 10,
          currentStave.innerX + currentStave.innerWidth + 10,
          currentStave.y + 10,
          currentStave.innerWidth,
        );
      }

      // 绘制从最后一行开头到结束音符的连音线
      const lastLineStartX = endStave.innerX - 10;
      const lastLineXDistance = Math.abs(
        endNote.x + endNote.width / 2 - lastLineStartX,
      );
      this.drawSingleTieLine(
        lastLineStartX,
        endNote.y + 10,
        endNote.x + endNote.width / 2,
        endNote.y + 10,
        lastLineXDistance,
      );
    } catch (error) {
      Logger.error(
        `跨行连音线绘制失败：${JSON.stringify(error)}`,
        'SNTieLineLayer',
      );
    }
  }

  /**
   * 绘制三连音连音线（beam）：两端为四分之一圆弧，中间为直线，数字3位于横线上方
   * @param endNote - 三连音的最后一个音符
   */
  static drawTripletBeamByRecord(endNote: SNNote) {
    // 直接用记录的首音和endNote绘制
    const startNote = this.tripletStartNotes.shift();
    if (!startNote) return;
    // 计算beam起止点
    const x1 = startNote.x + startNote.width / 2;
    const x2 = endNote.x + endNote.width / 2;
    const y = startNote.y + 10; // beam的y偏移量
    const arcR = 8; // 圆弧半径
    // 起点圆弧（左端，四分之一圆，向右上）
    SNTieLineLayer.el.appendChild(
      SvgUtils.createArc({
        x1: x1,
        y1: y + arcR,
        x2: x1 + arcR,
        y2: y,
        radiusX: arcR,
        radiusY: arcR,
        rotation: 0,
        largeArcFlag: false,
        sweepFlag: true,
        stroke: 'black',
        strokeWidth: 2,
      }),
    );
    // 终点圆弧（右端，四分之一圆，向左上）
    SNTieLineLayer.el.appendChild(
      SvgUtils.createArc({
        x1: x2 - arcR,
        y1: y,
        x2: x2,
        y2: y + arcR,
        radiusX: arcR,
        radiusY: arcR,
        rotation: 0,
        largeArcFlag: false,
        sweepFlag: true,
        stroke: 'black',
        strokeWidth: 2,
      }),
    );
    // 中间横线
    SNTieLineLayer.el.appendChild(
      SvgUtils.createLine({
        x1: x1 + arcR,
        y1: y,
        x2: x2 - arcR,
        y2: y,
        stroke: 'black',
        strokeWidth: 2,
      }),
    );
    // 绘制数字3
    SNTieLineLayer.el.appendChild(
      SvgUtils.createText({
        text: '3',
        x: (x1 + x2) / 2,
        y: y - 6, // 数字在beam上方
        fontSize: 14,
        textAnchor: 'middle',
      }),
    );
  }
}
