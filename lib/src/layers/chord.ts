import { SNNote } from '@components';
import { Logger, SvgUtils } from '@utils';
import { SNConfig } from '@config';

export class SNChordLayer {
  /** SVG group 元素，作为内容的容器 */
  static el: SVGGElement;

  /** 和弦层map，用于存储和弦层元素，key为音符index用于定位，value为和弦层元素 */
  static chordMap: Map<number, SVGElement> = new Map();

  /**
   * 和弦指位映射表，key为和弦名，value为positions数组
   * 支持字母和弦、数字和弦，与操作面板一致
   */
  static chordPositionsMap: Record<string, (number | null)[]> = {
    // 字母和弦
    C: [0, 1, 0, 2, 3, null],
    D: [2, 3, 2, 0, null, null],
    E: [0, 0, 1, 2, 2, 0],
    F: [1, 1, 2, 3, 3, 1],
    G: [3, 0, 0, 0, 2, 3],
    A: [0, 2, 2, 2, 0, null],
    B: [2, 4, 4, 4, 2, null],
    Am: [0, 1, 2, 2, 0, null],
    Dm: [1, 3, 2, 0, null, null],
    Em: [0, 0, 0, 2, 2, 0],
    Fm: [1, 1, 1, 3, 3, 1],
    Gm: [3, 3, 3, 0, 1, 3],
    Bm: [2, 3, 4, 4, 2, null],
    // 七和弦等可补充
    // 数字和弦（C大调常用指型）
    '1': [0, 1, 0, 2, 3, null], // C
    '2': [2, 3, 2, 0, null, null], // D
    '3': [0, 0, 1, 2, 2, 0], // E
    '4': [1, 1, 2, 3, 3, 1], // F
    '5': [3, 0, 0, 0, 2, 3], // G
    '6': [0, 2, 2, 2, 0, null], // A
    '7': [2, 4, 4, 4, 2, null], // B
    '1m': [0, 1, 2, 2, 0, null], // Am
    '2m': [1, 3, 2, 0, null, null], // Dm
    '3m': [0, 0, 0, 2, 2, 0], // Em
    '4m': [1, 1, 1, 3, 3, 1], // Fm
    '5m': [3, 3, 3, 0, 1, 3], // Gm
    '6m': [0, 2, 2, 2, 0, null], // Am
    '7m': [2, 3, 4, 4, 2, null], // Bm
    // 可继续扩展...
  };

  static defaultChordPositions = [null, null, null, null, null, null];

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
      // 查找和弦指位
      const positions =
        SNChordLayer.chordPositionsMap[note.chord!] ??
        SNChordLayer.defaultChordPositions;
      chordElement = SvgUtils.createGuitarChordDiagram(
        note.chord!,
        positions,
        x - 20,
        y - 32,
      );
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
