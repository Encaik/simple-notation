import type { SNPitch } from '@core/model/music';
// import { SNAccidental } from '@core/model/music'; // 暂时未使用，将在后续版本中添加变音记号支持
import type { SNVoiceMetaClef } from '@data/model/parser';

/**
 * 乐谱计算器
 *
 * 负责计算不同类型乐谱（五线谱、吉他谱、口琴谱等）中音符的位置和渲染属性
 * 布局层不需要关心渲染层渲染为什么乐谱，只需要调用这个模块获取计算结果
 */
export class StaffCalculator {
  /**
   * 五线谱配置
   */
  static readonly STAFF_CONFIG = {
    lineCount: 5, // 五线谱有5条线
    lineGap: 7.5, // 线间距（像素）
    staffHeight: 30, // 五线谱总高度（4个线间距）
    staffTop: 6, // 五线谱顶部 y 坐标偏移
  };

  /**
   * 不同谱号的参考音高（第一条线的音高）
   * 五线谱从下往上编号，第一条线（最下面）是第0条线
   */
  static readonly CLEF_REFERENCE_NOTES: Record<
    SNVoiceMetaClef,
    { letter: string; octave: number }
  > = {
    treble: { letter: 'E', octave: 3 }, // 高音谱号：第一条线是 E3（ABC记谱法中大写字母基准八度为3）
    bass: { letter: 'G', octave: 2 }, // 低音谱号：第一条线是 G2
    alto: { letter: 'C', octave: 4 }, // 中音谱号：第一条线是 C4
    tenor: { letter: 'C', octave: 4 }, // 次中音谱号：第一条线是 C4
  };

  /**
   * 音名字母到半音数的映射（C=0, D=2, E=4, F=5, G=7, A=9, B=11）
   */
  private static readonly LETTER_TO_SEMITONE: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };

  /**
   * 计算音符在五线谱上的 y 坐标
   *
   * @param pitch 音高信息
   * @param clef 谱号（默认为高音谱号）
   * @param staffTop 五线谱顶部 y 坐标（默认使用配置值）
   * @param staffHeight 五线谱高度（默认使用配置值）
   * @returns 音符符头中心的 y 坐标
   */
  static calculateNoteY(
    pitch: SNPitch,
    clef: SNVoiceMetaClef = 'treble',
    staffTop: number = StaffCalculator.STAFF_CONFIG.staffTop,
    staffHeight: number = StaffCalculator.STAFF_CONFIG.staffHeight,
  ): number {
    // 获取谱号的参考音高
    const referenceNote = StaffCalculator.CLEF_REFERENCE_NOTES[clef];

    // 注意：变音记号的处理暂时未实现，将在后续版本中添加

    // 第一条线（最下面）的 y 坐标
    const lineGap = staffHeight / 4; // 线间距
    const firstLineY = staffTop + staffHeight; // 第一条线在五线谱底部

    // 在五线谱中，每个线或间对应一个自然音阶的音符位置
    // 五线谱的自然音阶排列：E-F-G-A-B-C-D-E-F-G-A-B-C-D...
    // 从E到F是1个半音，从F到G是1个半音，从G到A是1个半音，等等
    // 但在五线谱上，从一条线到下一个间是1个位置（0.5个线间距），从一条线到下一条线是2个位置（1个线间距）
    //
    // 对于ABC记谱法（E3作为第一条线）：
    // - 第一条线：E3
    // - 下加一线：C3（E3下方，但只向下0.5个线间距）
    // - 第一间：F3（E3上方0.5个线间距）
    // - 第二条线：G3（E3上方1个线间距）
    //
    // 因此，我们需要根据音符在自然音阶中的位置来计算，而不是直接使用MIDI半音差
    //
    // 计算音符在自然音阶中相对于参考音高的位置差
    // 从E3开始，向上：E3->F3->G3->A3->B3->C4->D4->E4->F4->G4...
    // 向下：E3->D3->C3->B2->A2->G2->F2->E2...
    const refLetterIndex = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(
      referenceNote.letter,
    );
    const noteLetterIndex = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(
      pitch.letter.toUpperCase(),
    );

    // 计算八度差和字母差
    const octaveDiff = pitch.octave - referenceNote.octave;
    const letterDiff = noteLetterIndex - refLetterIndex;

    // 计算在自然音阶中的位置差（从参考音高开始，向上或向下移动多少个自然音阶位置）
    // 每个自然音阶位置对应半个线间距（0.5 * lineGap）
    // 例如：从E3到G3，向上移动2个位置（E3->F3->G3），对应1个线间距
    const positionDiff = octaveDiff * 7 + letterDiff;

    // 计算y坐标：positionDiff为正数时，音符在参考音高上方，y坐标更小
    const y = firstLineY - positionDiff * (lineGap / 2);

    return y;
  }

  /**
   * 判断音符是否需要符干
   *
   * @param duration 音符时值（ticks）
   * @param ticksPerWhole 全音符的 ticks 数（默认 48）
   * @returns 是否需要符干
   */
  static needsStem(duration: number, ticksPerWhole: number = 48): boolean {
    // 全音符（duration = ticksPerWhole）不需要符干
    // 二分音符及更短的需要符干
    return duration < ticksPerWhole;
  }

  /**
   * 判断音符是实心还是空心
   *
   * @param duration 音符时值（ticks）
   * @param ticksPerWhole 全音符的 ticks 数（默认 48）
   * @returns 是否为实心（true=实心，false=空心）
   */
  static isFilledNote(duration: number, ticksPerWhole: number = 48): boolean {
    // 全音符和二分音符是空心的，四分音符及更短的是实心的
    const halfNoteTicks = ticksPerWhole / 2;
    return duration < halfNoteTicks;
  }

  /**
   * 计算音符需要的符尾数量
   *
   * @param duration 音符时值（ticks）
   * @param ticksPerWhole 全音符的 ticks 数（默认 48）
   * @returns 符尾数量（0=无符尾，1=八分音符，2=十六分音符，3=三十二分音符）
   *
   * @example
   * ```typescript
   * // ticksPerWhole = 48
   * getFlagCount(48, 48) // 0 - 全音符，无符尾
   * getFlagCount(24, 48) // 0 - 二分音符，无符尾
   * getFlagCount(12, 48) // 0 - 四分音符，无符尾
   * getFlagCount(6, 48)  // 1 - 八分音符，1个符尾
   * getFlagCount(3, 48)  // 2 - 十六分音符，2个符尾
   * ```
   */
  static getFlagCount(duration: number, ticksPerWhole: number = 48): number {
    // 四分音符的 ticks 数
    const quarterNoteTicks = ticksPerWhole / 4;

    // 四分音符及更长的音符不需要符尾
    if (duration >= quarterNoteTicks) {
      return 0;
    }

    // 计算符尾数量：每缩短一半，增加一个符尾
    // 八分音符 = 四分音符 / 2 = 1个符尾
    // 十六分音符 = 四分音符 / 4 = 2个符尾
    // 三十二分音符 = 四分音符 / 8 = 3个符尾
    let flagCount = 0;
    let currentDuration = quarterNoteTicks;

    while (currentDuration > duration && flagCount < 4) {
      currentDuration /= 2;
      flagCount++;
    }

    return flagCount;
  }

  /**
   * 判断符干方向
   *
   * @param noteY 音符的 y 坐标
   * @param clef 谱号（默认为高音谱号）
   * @param staffTop 五线谱顶部 y 坐标（默认使用配置值）
   * @param staffHeight 五线谱高度（默认使用配置值）
   * @returns 符干方向（true=向上，false=向下）
   */
  static getStemDirection(
    noteY: number,
    _clef: SNVoiceMetaClef = 'treble',
    staffTop: number = StaffCalculator.STAFF_CONFIG.staffTop,
    staffHeight: number = StaffCalculator.STAFF_CONFIG.staffHeight,
  ): boolean {
    // 计算中间线（第三条线）的 y 坐标
    const middleLineY = staffTop + staffHeight / 2; // 中间线在五线谱中间

    // 音符在中间线及以上时，符干向下（stemUp = false）
    // 音符在中间线以下时，符干向上（stemUp = true）
    return noteY > middleLineY;
  }

  /**
   * 计算需要绘制的辅助线（ledger lines）的 y 坐标
   *
   * @param noteY 音符的 y 坐标
   * @param staffTop 五线谱顶部 y 坐标（默认使用配置值）
   * @param staffHeight 五线谱高度（默认使用配置值）
   * @returns 辅助线的 y 坐标数组（从下往上排序）
   */
  static getLedgerLines(
    noteY: number,
    staffTop: number = StaffCalculator.STAFF_CONFIG.staffTop,
    staffHeight: number = StaffCalculator.STAFF_CONFIG.staffHeight,
  ): number[] {
    const lineGap = staffHeight / 4; // 线间距
    const firstLineY = staffTop + staffHeight; // 第一条线（最下面）的 y 坐标
    const lastLineY = staffTop; // 第五条线（最上面）的 y 坐标
    const ledgerLines: number[] = [];
    const tolerance = lineGap / 4; // 判断音符是否在线上的容差

    // 检查音符符头是否在线上（而不是在线间）
    // 音符在线上时，y坐标应该接近某条线的位置（允许一定误差）
    const isOnLine = (y: number, lineY: number): boolean => {
      return Math.abs(y - lineY) < tolerance;
    };

    // 检查音符是否低于第一线（需要下加线）
    if (noteY > firstLineY) {
      // 从第一条线下方开始，每个线间距绘制一条辅助线，直到音符符头所在的线
      let currentLineY = firstLineY + lineGap;
      // 继续向下绘制，直到音符符头所在的线或更下方
      while (currentLineY <= noteY + tolerance) {
        // 如果音符符头在这条线上，或者这条线在音符符头下方，都需要绘制
        if (
          isOnLine(noteY, currentLineY) ||
          currentLineY <= noteY + tolerance
        ) {
          ledgerLines.push(currentLineY);
        }
        currentLineY += lineGap;
      }
    }

    // 检查音符是否高于第五线（需要上加线）
    if (noteY < lastLineY) {
      // 从第五条线上方开始，每个线间距绘制一条辅助线，直到音符符头所在的线
      let currentLineY = lastLineY - lineGap;
      // 继续向上绘制，直到音符符头所在的线或更上方
      while (currentLineY >= noteY - tolerance) {
        // 如果音符符头在这条线上，或者这条线在音符符头上方，都需要绘制
        if (
          isOnLine(noteY, currentLineY) ||
          currentLineY >= noteY - tolerance
        ) {
          ledgerLines.push(currentLineY);
        }
        currentLineY -= lineGap;
      }
    }

    // 去重并按从下往上排序
    return Array.from(new Set(ledgerLines)).sort((a, b) => a - b);
  }

  /**
   * 获取音符的渲染属性
   *
   * @param pitch 音高信息
   * @param duration 音符时值（ticks）
   * @param clef 谱号（默认为高音谱号）
   * @param ticksPerWhole 全音符的 ticks 数（默认 48）
   * @param staffTop 五线谱顶部 y 坐标（默认使用配置值）
   * @param staffHeight 五线谱高度（默认使用配置值）
   * @returns 音符渲染属性
   */
  static getNoteRenderProps(
    pitch: SNPitch,
    duration: number,
    clef: SNVoiceMetaClef = 'treble',
    ticksPerWhole: number = 48,
    staffTop: number = StaffCalculator.STAFF_CONFIG.staffTop,
    staffHeight: number = StaffCalculator.STAFF_CONFIG.staffHeight,
  ): {
    y: number;
    isFilled: boolean;
    needsStem: boolean;
    stemDirection: boolean; // true=向上，false=向下
    flagCount: number; // 符尾数量
  } {
    const y = StaffCalculator.calculateNoteY(
      pitch,
      clef,
      staffTop,
      staffHeight,
    );
    const isFilled = StaffCalculator.isFilledNote(duration, ticksPerWhole);
    const needsStem = StaffCalculator.needsStem(duration, ticksPerWhole);
    const stemDirection = StaffCalculator.getStemDirection(
      y,
      clef,
      staffTop,
      staffHeight,
    );
    const flagCount = StaffCalculator.getFlagCount(duration, ticksPerWhole);

    return {
      y,
      isFilled,
      needsStem,
      stemDirection,
      flagCount,
    };
  }
}
