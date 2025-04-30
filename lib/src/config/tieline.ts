import { SNNote } from '../components/note';
import { SvgUtils } from '@utils';

export class SNTieLine {
  static tieStartNotes: SNNote[] = [];
  private static scoreEl: SVGGElement;

  constructor(scoreEl: SVGGElement) {
    SNTieLine.scoreEl = scoreEl;
  }

  /**
   * 记录连音的起始音符
   * @param note - 连音的起始音符
   */
  static recordTieStart(note: SNNote) {
    this.tieStartNotes.push(note);
  }

  /**
   * 绘制连音线并移除已使用的起始音符记录
   * @param endNote - 连音的结束音符
   */
  static drawTieLineFromRecord(endNote: SNNote) {
    const startNote = this.tieStartNotes.pop();
    if (startNote) {
      const xDistance = Math.abs(endNote.x - startNote.x);
      // 可以根据需要调整比例系数，这里设置为 0.2
      const dynamicRadiusY = xDistance * 0.08;
      SNTieLine.scoreEl.appendChild(
        SvgUtils.createArc({
          x1: startNote.x + startNote.width / 2,
          y1: startNote.y + 10,
          x2: endNote.x + endNote.width / 2,
          y2: endNote.y + 10,
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
  }
}
