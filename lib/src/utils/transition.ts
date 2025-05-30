import {
  guitarChordPositionsMap,
  GuitarPosition,
  guitarTuningMidis,
  scaleMap,
  transposeKeyMap,
} from '@types';

const baseOctave = 4; // 简谱数字1-7的默认八度

/**
 * 乐谱和乐器之间转换的工具类
 */
export class SNTransition {
  /**
   * 通用的乐理/简谱数字转换方法
   */
  static General = {
    // 定义简谱音符1-7的基本MIDI值 (假设1是C4, MIDI 60)
    baseSimpleNoteMidis: {
      '1': 60, // C4
      '2': 62, // D4
      '3': 64, // E4
      '4': 65, // F4
      '5': 67, // G4
      '6': 69, // A4
      '7': 71, // B4
      '0': -1, // Rest note, no position
    } as Record<string, number>,

    /**
     * 将音名（带八度）转换为 MIDI 值。
     * @param {string} noteName - 音名字符串 (e.g., 'C4', 'D#4', 'Gb3').
     * @returns {number | null} 对应的 MIDI 值或 null (无效音名).
     */
    noteNameToMidi(noteName: string): number | null {
      // 基本实现 - 可以扩展以增强鲁棒性
      const noteMatch = noteName.match(/^([A-G])([#b]*)(-?\d+)$/);
      if (!noteMatch) return null;

      const baseNote = noteMatch[1];
      const accidentals = noteMatch[2];
      const octave = parseInt(noteMatch[3], 10);

      // 获取基音的索引 (C=0, D=2, E=4, F=5, G=7, A=9, B=11)
      const baseNoteIndexMap: { [key: string]: number } = {
        C: 0,
        D: 2,
        E: 4,
        F: 5,
        G: 7,
        A: 9,
        B: 11,
      };
      const noteIndex = baseNoteIndexMap[baseNote];
      if (noteIndex === undefined) return null; // Should not happen with regex, but for safety

      // 计算升降号带来的半音变化
      let accidentalSemitones = 0;
      for (const acc of accidentals) {
        if (acc === '#') accidentalSemitones++;
        else if (acc === 'b') accidentalSemitones--;
      }

      // 计算相对于C0的总半音数
      // 这里的八度是科学音高记号法 (Middle C is C4), MIDI 0 是 C-1
      // 所以需要 (octave + 1) * 12
      const totalSemitones =
        (octave + 1) * 12 + noteIndex + accidentalSemitones;

      // MIDI 值范围是 0-127
      if (totalSemitones < 0 || totalSemitones > 127) {
        return null;
      }

      return totalSemitones;
    },

    /**
     * 将 MIDI 值转换为音名（带八度）。
     * @param {number} midi - MIDI 值。
     * @returns {string} 对应的音名字符串 (e.g., 'C4', 'D#4').
     */
    midiToNoteName(midi: number): string {
      const notes = [
        'C',
        'C#',
        'D',
        'D#',
        'E',
        'F',
        'F#',
        'G',
        'G#',
        'A',
        'A#',
        'B',
      ];
      const octave = Math.floor(midi / 12) - 1; // MIDI 0 is C-1
      const noteIndex = midi % 12;

      return notes[noteIndex] + octave;
    },

    /**
     * 将简谱数字和八度、升降号信息转换为音名 (e.g., '1' -> 'C4', '#2' -> 'D#4', '5(.') -> 'G3').
     * @param {string} noteValue - 简谱数字字符串 (e.g., '1', '#2', '5').
     * @param {number} octaveCount - 八度升降数量 (正数升八度, 负数降八度, 0不变)。
     * @param {number} upDownCount - 升降号数量 (正数升半音, 负数降半音, 0不变)。
     * @returns {string | null} 对应的音名字符串 (e.g., 'C4', 'D#4', 'G3') 或 null (休止符或无效音符)。
     */
    simpleNoteToNoteName(
      noteValue: string,
      octaveCount: number,
      upDownCount: number,
    ): string | null {
      const num = parseInt(noteValue.replaceAll(/[()（）]/g, ''), 10);
      if (isNaN(num) || num < 1 || num > 7) {
        // Handle rests or invalid notes
        return noteValue === '0' ? null : null; // Return null for rest (0) and other invalid inputs
      }

      let noteName = scaleMap[num - 1];
      if (upDownCount > 0) noteName += '#'.repeat(upDownCount);
      if (upDownCount < 0) noteName += 'b'.repeat(Math.abs(upDownCount));

      const octave = baseOctave + octaveCount;
      noteName += octave;

      return noteName;
    },

    /**
     * 将 MIDI 值转换为 SimpleNotation 模板格式的音高字符串 (e.g., 60 -> "1", 61 -> "#1", 72 -> "^1").
     * 仅处理音高信息，不考虑时值、休止符、小节线等。
     * @param {number} midi - MIDI 值。
     * @returns {string | null} SimpleNotation 格式的音高字符串，或 null (无效 MIDI 值)。
     */
    MidiToSimpleNote(midi: number): string | null {
      if (midi < 0 || midi > 127) {
        return null; // 无效 MIDI 值
      }
      const octave = Math.floor(midi / 12) - 1;
      const octaveDiff = octave - baseOctave;
      const semitonesInOctave = midi % 12;
      let simpleNoteNumber: number | undefined;
      let accidental = '';

      // 确定简谱数字和升降号
      // 映射半音数到简谱数字和升降号
      switch (semitonesInOctave) {
        case 0:
          simpleNoteNumber = 1;
          break; // C
        case 1:
          simpleNoteNumber = 1;
          accidental = '#';
          break; // C# -> #1
        case 2:
          simpleNoteNumber = 2;
          break; // D
        case 3:
          simpleNoteNumber = 2;
          accidental = '#';
          break; // D# -> #2
        case 4:
          simpleNoteNumber = 3;
          break; // E
        case 5:
          simpleNoteNumber = 4;
          break; // F
        case 6:
          simpleNoteNumber = 4;
          accidental = '#';
          break; // F# -> #4
        case 7:
          simpleNoteNumber = 5;
          break; // G
        case 8:
          simpleNoteNumber = 5;
          accidental = '#';
          break; // G# -> #5
        case 9:
          simpleNoteNumber = 6;
          break; // A
        case 10:
          simpleNoteNumber = 6;
          accidental = '#';
          break; // A# -> #6
        case 11:
          simpleNoteNumber = 7;
          break; // B
        default:
          return null; // 不应该发生
      }

      if (simpleNoteNumber === undefined) return null;

      // 确定八度标记
      let octaveMarker = '';
      if (octaveDiff > 0) {
        octaveMarker = '^'.repeat(octaveDiff);
      } else if (octaveDiff < 0) {
        octaveMarker = '_'.repeat(Math.abs(octaveDiff));
      }

      // 组合生成 SimpleNotation 格式的音高字符串
      return `${accidental}${simpleNoteNumber}${octaveMarker}`;
    },

    /**
     * 获取当前调式的移调半音数（以C为0，D为2，E为4等）
     * 支持大调常用调式
     * @param {string | undefined} key - 乐谱的主调调式字符串。
     * @returns {number} 对应的移调半音数。
     */
    getTransposeByKey(key: string | undefined): number {
      if (!key) return 0;
      const k = key.replace(/m(aj7)?|m7|7|dim|sus|add|\d+/gi, '');
      return transposeKeyMap[k] ?? 0;
    },
  };

  /**
   * 吉他相关的转换方法
   */
  static Guitar = {
    /**
     * 查找给定 MIDI 音高在吉他指板上的所有可能位置。
     * @param {number} midi - 音符的 MIDI 值（考虑了吉他低八度约定）。
     * @param {number} [maxFret=17] - 最大查找品位。
     * @returns {GuitarPosition[]} - 所有可能的品位/弦组合数组。
     */
    findAllPositionsForMidi(
      midi: number,
      maxFret: number = 17,
    ): GuitarPosition[] {
      const positions: GuitarPosition[] = [];
      for (let string = 6; string >= 1; string--) {
        const openMidi = guitarTuningMidis[string];
        const fret = midi - openMidi;
        if (fret >= 0 && fret <= maxFret) {
          positions.push({ string, fret });
        }
      }
      return positions;
    },

    /**
     * 查找给定 MIDI 音高在 capo 移调后的优先品位区域（例如 capo 品位到 capo 品位+3）内的位置。
     * 如果 capo 为 0，则优先区域为 0-3 品。
     * @param {number} midi - 音符的 MIDI 值（考虑了吉他低八度约定）。
     * @param {number} transposeValue - 当前的移调（Capo）值。
     * @param {number} [preferredFretRange=3] - 优先查找的品位范围（从 capo 品位开始）。
     * @param {number} [maxFret=17] - 最大查找品位。
     * @returns {GuitarPosition[]} - 优先区域内的品位/弦组合数组。
     */
    findPreferredPositionsForMidi(
      midi: number,
      transposeValue: number,
      preferredFretRange: number = 3,
      maxFret: number = 17,
    ): GuitarPosition[] {
      const preferredPositions: GuitarPosition[] = [];
      const preferredFretStart = transposeValue;
      const preferredFretEnd = transposeValue + preferredFretRange;

      for (let string = 6; string >= 1; string--) {
        const openMidi = guitarTuningMidis[string];
        const fret = midi - openMidi;

        if (
          fret >= preferredFretStart &&
          fret <= preferredFretEnd &&
          fret >= 0 &&
          fret <= maxFret
        ) {
          preferredPositions.push({ string, fret });
        }
      }
      return preferredPositions;
    },

    /**
     * 获取吉他和弦符号对应的吉他指板品位。
     * @param {string} chordSymbol - 吉他和弦符号 (e.g., 'C', 'Am').
     * @returns {(number | null)[] | undefined} 对应的品位数组 (6弦到1弦)，null 表示不弹。
     */
    getChordFretPositions(chordSymbol: string): (number | null)[] | undefined {
      return guitarChordPositionsMap[chordSymbol];
    },

    /**
     * 将吉他品位和弦号转换为音高数组。
     * @param {(number | null)[]} fretPositions - 吉他指板品位数组 (6弦到1弦)，null 表示不弹。
     * @returns {string[]} 对应的音高字符串数组 (e.g., ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']).
     */
    fretPositionsToNoteNames(fretPositions: (number | null)[]): string[] {
      const notes: string[] = [];
      fretPositions.forEach((fret, stringIndex) => {
        const stringNumber = 6 - stringIndex; // Convert 0-5 index to 6-1 string number
        if (fret !== null) {
          const openMidi = guitarTuningMidis[stringNumber];
          const playedMidi = openMidi + fret;
          notes.push(SNTransition.General.midiToNoteName(playedMidi));
        }
      });
      return notes;
    },

    // Method to find the best position for a simple note on the guitar fretboard (from note.ts)
    /**
     * 获取简谱音符在吉他流行谱上显示的位置和数字。
     * 根据简谱音符、八度和升降号计算其在吉他指板上的弦和品位。
     * 遵循吉他记谱通常高一个八度的约定（实际发音低一个八度），并将输入的 MIDI 值减去 12。
     * 优先选择低把位的品（0-`preferredMaxFret`）。如果低把位没有找到，则在整个指板范围内查找。
     * @param {string} noteValue - 简谱音符的字符串表示。
     * @param {number} octaveCount - 音符的八度升降数量。
     * @param {number} upDownCount - 音符的升降号数量。
     * @param {number} [preferredMaxFret=3] - 优先查找的最高品位。
     * @param {number} [maxFret=17] - 最大查找品位。
     * @returns {{ string: number | null; fret: number | null }} 一个对象，包含弦号 (string) 和品位 (fret)，如果找不到位置则 fret 为 null。
     */
    getSimpleNoteGuitarPosition(
      noteValue: string,
      octaveCount: number,
      upDownCount: number,
      preferredMaxFret: number = 3,
      maxFret: number = 17,
    ): { string: number | null; fret: number | null } {
      // Define basic MIDI values for simple notation notes 1-7 (assuming 1 is C4, MIDI 60)
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

      const baseMidi = baseMidiNotes[noteValue];

      if (baseMidi === undefined || baseMidi === -1) {
        return { string: null, fret: null };
      }

      // Calculate target MIDI note based on octave and accidental
      const targetMidi = baseMidi + octaveCount * 12 + upDownCount;

      // According to guitar notation convention (sounding an octave lower), subtract 12 from the target MIDI value
      const actualSoundingMidi = targetMidi - 12;

      // Define MIDI notes for standard guitar tuning (E2 A2 D3 G3 B3 E4)
      const guitarTuningMidisArray: number[] = [40, 45, 50, 55, 59, 64]; // MIDI values for strings 6-1

      // First, try to find the position within the preferred fret range
      for (let s = 0; s < guitarTuningMidisArray.length; s++) {
        const openStringMidi = guitarTuningMidisArray[s];
        for (let f = 0; f <= preferredMaxFret && f <= maxFret; f++) {
          const fretMidi = openStringMidi + f;
          if (fretMidi === actualSoundingMidi) {
            // Found note position in the preferred range
            const string = 6 - s; // Guitar string numbers are typically 1-6 from thin to thick
            const fret = f;
            // Return the first preferred position found (prioritizing lower strings, then lower frets)
            return { string, fret };
          }
        }
      }

      // If not found in the preferred range, search within the entire fretboard range
      for (let s = 0; s < guitarTuningMidisArray.length; s++) {
        const openStringMidi = guitarTuningMidisArray[s];
        for (let f = preferredMaxFret + 1; f <= maxFret; f++) {
          const fretMidi = openStringMidi + f;
          if (fretMidi === actualSoundingMidi) {
            // Found note position in the entire fretboard range
            const string = 6 - s;
            const fret = f;
            // Return the first non-preferred position found
            return { string, fret };
          }
        }
      }

      // If no note position is found within the maximum fret range
      return { string: null, fret: null };
    },
  };

  static Piano = {};
}
