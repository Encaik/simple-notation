import { SNNote, SNStave } from '@components';
import { Logger, SvgUtils } from '@utils';
import { SNConfig } from '@config';
import { SNChordType } from '@types';

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
    // 七和弦等可补充 - Maj7 和 m7
    Cmaj7: [0, 0, 2, 0, 1, 0], // Cmaj7
    Dmaj7: [null, null, 0, 2, 2, 2], // Dmaj7
    Emaj7: [0, 2, 1, 1, 0, null], // Emaj7
    Fmaj7: [1, 3, 3, 2, 1, 1], // Fmaj7
    Gmaj7: [3, 2, 0, 0, 0, 2], // Gmaj7
    Amaj7: [null, 0, 2, 1, 2, 0], // Amaj7
    Bmaj7: [null, 2, 1, 3, 2, null], // Bmaj7
    Cm7: [null, 3, 5, 3, 4, 3], // Cm7
    Dm7: [null, null, 0, 2, 1, 1], // Dm7
    Em7: [0, 2, 2, 0, 3, 0], // Em7
    Fm7: [1, 3, 3, 1, 1, 1], // Fm7
    Gm7: [3, 5, 3, 3, 3, 3], // Gm7
    Am7: [null, 0, 2, 0, 1, 0], // Am7
    Bm7: [null, 2, 4, 2, 3, 2], // Bm7
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
    // 数字七和弦等可补充 - Maj7 和 m7
    '1maj7': [0, 0, 2, 0, 1, 0], // Cmaj7
    '2maj7': [null, null, 0, 2, 2, 2], // Dmaj7
    '3maj7': [0, 2, 1, 1, 0, null], // Emaj7
    '4maj7': [1, 3, 3, 2, 1, 1], // Fmaj7
    '5maj7': [3, 2, 0, 0, 0, 2], // Gmaj7
    '6maj7': [null, 0, 2, 1, 2, 0], // Amaj7
    '7maj7': [null, 2, 1, 3, 2, null], // Bmaj7
    '1m7': [null, 3, 5, 3, 4, 3], // Cm7
    '2m7': [null, null, 0, 2, 1, 1], // Dm7
    '3m7': [0, 2, 2, 0, 3, 0], // Em7
    '4m7': [1, 3, 3, 1, 1, 1], // Fm7
    '5m7': [3, 5, 3, 3, 3, 3], // Gm7
    '6m7': [null, 0, 2, 0, 1, 0], // Am7
    '7m7': [null, 2, 4, 2, 3, 2], // Bm7
    // 可继续扩展...
  };

  static defaultChordPositions = [null, null, null, null, null, null];

  constructor(svg: SVGElement) {
    Logger.debug('constructor 初始化和弦层', 'SNChordLayer');
    SNChordLayer.el = SvgUtils.createG({ tag: 'chord' });
    svg.appendChild(SNChordLayer.el);
  }

  static addChord(note: SNNote) {
    // 如果note.chord不存在或为空数组，则不绘制
    // note.chord现在是string[]类型
    if (!Array.isArray(note.chord) || note.chord.length === 0) {
      return;
    }

    // 清除旧的和弦元素（如果存在）
    if (SNChordLayer.chordMap.has(note.index)) {
      SNChordLayer.chordMap.get(note.index)?.remove();
      SNChordLayer.chordMap.delete(note.index);
    }

    // 创建一个SVG group来包含所有绘制的符号
    const chordGroup = SvgUtils.createG({
      tag: `chord-group-${note.index}`,
    });

    // 根据和弦类型创建不同的显示元素
    const chordType = SNConfig.score.chordType ?? SNChordType.Default;

    // 遍历chord数组，绘制已知符号（和弦、分段符、换气符等）
    let drawnElementCount = 0; // 记录绘制的元素数量，用于调整位置
    const baseX = note.x + note.width / 2;
    // 调整基线位置，使其更靠近音符上方
    const baseY = note.y - (SNConfig.score.chordHeight ?? 13) / 2 + 5;

    // 检查是否含有分段符，如果含有则调整和弦的垂直位置
    const hasSectionRepeat = note.chord.some((symbol) =>
      symbol.match(/^\d+\.$/),
    );
    const verticalOffset = hasSectionRepeat ? -20 : 0; // 如果有分段符，向上偏移15像素

    note.chord.forEach((symbol: string) => {
      let elementToDraw: SVGElement | null = null;

      switch (symbol) {
        case 'v':
        case 'V': {
          // 绘制换气符 (使用Bravura字体对应的Unicode字符)
          // 换气符位置相对于当前音符中心
          const breathMarkX = note.x; // 根据已绘制元素数量调整位置
          const breathMarkY = baseY + 10; // 微调y坐标使其对齐
          elementToDraw = SvgUtils.createText({
            x: breathMarkX,
            y: breathMarkY,
            text: 'v', // Bravura字体中的换气符Unicode
            fontSize: 16,
            textAnchor: 'middle',
          });
          break;
        }
        default:
          // 判断是否是分段符 (e.g., "1.", "2.")
          if (symbol.match(/^\d+\.$/)) {
            // 创建一个新的group来包含分段符的数字和L型线
            const sectionRepeatGroup = SvgUtils.createG({
              tag: `section-repeat-${note.index}-${symbol}`,
            });

            // 绘制分段符数字
            const numberText = SvgUtils.createText({
              text: symbol,
              x: note.parent!.innerX,
              y: note.y,
              fontSize: 14,
              fontFamily:
                '"SimHei", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "WenQuanYi Micro Hei", sans-serif',
              textAnchor: 'start',
            });
            sectionRepeatGroup.appendChild(numberText);

            // 绘制L型线
            const lineLength = 80; // L型线的长度
            const startX = note.parent!.x - SNStave.BAR_LINE_WIDTH; // L型线起始x坐标 (左下角)
            const startY = note.y - 15; // L型线起始y坐标 (顶部)

            // 创建path元素
            const lPath = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'path',
            );

            // 定义路径数据 (从左下角 M 到左上角 L 再到右上角 L)
            const pathData = `M ${startX},${startY + 15} L ${startX},${startY} L ${startX + lineLength},${startY}`;
            lPath.setAttribute('d', pathData);
            lPath.setAttribute('stroke', 'black');
            lPath.setAttribute('stroke-width', '1');
            lPath.setAttribute('fill', 'none'); // L型线不需要填充

            sectionRepeatGroup.appendChild(lPath);

            elementToDraw = sectionRepeatGroup;
          } else if (SNChordLayer.chordPositionsMap[symbol]) {
            // 绘制和弦符号
            // 和弦符号位置相对于当前音符中心
            const chordX = baseX;
            const chordY = baseY + verticalOffset; // 应用垂直偏移

            if (chordType === 'guitar') {
              // 查找和弦指位（吉他指位图）
              const positions =
                SNChordLayer.chordPositionsMap[symbol] ??
                SNChordLayer.defaultChordPositions;
              elementToDraw = SvgUtils.createGuitarChordDiagram(
                symbol,
                positions,
                chordX - 20, // 微调位置
                chordY - 32, // 微调位置
              );
            } else {
              // 创建默认文本和弦
              elementToDraw = SvgUtils.createText({
                text: symbol,
                x: chordX,
                y: chordY,
                fontSize: 14,
                fontFamily:
                  '"SimHei", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "WenQuanYi Micro Hei", sans-serif',
                textAnchor: 'middle',
              });
            }
          }
          break;
      }

      if (elementToDraw) {
        chordGroup.appendChild(elementToDraw);
        drawnElementCount++;
      }
    });

    // 如果绘制了任何符号，将group添加到和弦层map并添加到SVG中
    if (drawnElementCount > 0) {
      SNChordLayer.chordMap.set(note.index, chordGroup);
      SNChordLayer.el.appendChild(chordGroup);
    }
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
