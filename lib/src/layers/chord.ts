import { SNNote } from '@components';
import { Logger, SvgUtils } from '@utils';
import { SNConfig } from '@config';

export class SNChordLayer {
  /** SVG group 元素，作为内容的容器 */
  static el: SVGGElement;

  /** 和弦层map，用于存储和弦层元素，key为音符index用于定位，value为和弦层元素 */
  static chordMap: Map<number, SVGElement> = new Map();

  constructor(svg: SVGElement) {
    Logger.debug('constructor 初始化和弦层', 'SNChordLayer');
    SNChordLayer.el = SvgUtils.createG({ tag: 'chord' });
    svg.appendChild(SNChordLayer.el);
  }

  static addChord(note: SNNote) {
    // 创建和弦层元素，y为和弦区中线，x为音符中线
    const y = note.y - SNConfig.score.chordHeight / 2;
    const x = note.x + note.width / 2;

    // 根据和弦类型创建不同的显示元素
    const chordType = SNConfig.score.chordType ?? 'default';
    let chordElement: SVGElement;

    if (chordType === 'guitar') {
      // 创建吉他和弦图
      return;
    } else {
      // 创建默认文本和弦
      chordElement = SvgUtils.createText({
        text: note.chord,
        x,
        y,
        fontSize: 14,
        fontFamily:
          '"SimHei", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "WenQuanYi Micro Hei", sans-serif',
        textAnchor: 'middle',
      });
    }

    // 添加和弦层元素到和弦层map
    if (SNChordLayer.chordMap.has(note.index)) {
      SNChordLayer.chordMap.get(note.index)?.remove();
      SNChordLayer.chordMap.delete(note.index);
    }
    SNChordLayer.chordMap.set(note.index, chordElement);
    SNChordLayer.el.appendChild(chordElement);
  }

  static removeChord(note: SNNote) {
    if (SNChordLayer.chordMap.has(note.index)) {
      SNChordLayer.chordMap.get(note.index)?.remove();
      SNChordLayer.chordMap.delete(note.index);
    }
  }

  static destroyed() {
    SNChordLayer.chordMap.forEach((chord) => {
      chord.remove();
    });
  }
}
