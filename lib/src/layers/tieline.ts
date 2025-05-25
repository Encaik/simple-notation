import { SNNote } from '../components/note';
import { Logger, SvgUtils } from '@utils';
import { SNStave } from '../components/stave';
import { SNScore } from '../components/score';

export class SNTieLineLayer {
  static tieStartNotes: SNNote[] = [];
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
   * 绘制单条连音线
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
}
