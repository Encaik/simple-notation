import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useTone } from '../../use/useTone';
import type { GuitarPosition } from '../../model';
import { SNTransition } from '@utils';

const guitarTuning: Record<number, string> = {
  6: 'E2', // Low E 低音 E
  5: 'A2', // A
  4: 'D3', // D
  3: 'G3', // G
  2: 'B3', // B
  1: 'E4', // High E 高音 E
};

// Simplified chord positions map (can be expanded later based on SNChordLayer if needed)
// Key is chord symbol, value is array of fret numbers for each string (6 to 1)
// null means string is not played
const guitarChordPositionsMap: Record<string, (number | null)[]> = {
  C: [null, 3, 2, 0, 1, 0], // C
  D: [null, null, 0, 2, 3, 2], // D
  E: [0, 2, 2, 1, 0, 0], // E
  F: [1, 3, 3, 2, 1, 1], // F
  G: [3, 2, 0, 0, 0, 3], // G
  A: [null, 0, 2, 2, 2, 0], // A
  B: [null, 2, 4, 4, 4, 2], // B
  Am: [null, 0, 2, 2, 1, 0], // Am
  Dm: [null, null, 0, 2, 3, 1], // Dm
  Em: [0, 2, 2, 0, 0, 0], // Em
  Fm: [1, 3, 3, 1, 1, 1], // Fm
  Gm: [3, 5, 5, 3, 3, 3], // Gm
  Bm: [null, 2, 4, 4, 3, 2], // Bm
  Cmaj7: [null, 3, 2, 0, 0, 0], // Cmaj7
  Dmaj7: [null, null, 0, 2, 2, 2], // Dmaj7
  Emaj7: [0, 2, 1, 1, 0, 0], // Emaj7
  Fmaj7: [1, 3, 3, 2, 1, 1], // Fmaj7 - using F barre shape
  Gmaj7: [3, 2, 0, 0, 0, 2], // Gmaj7
  Amaj7: [null, 0, 2, 1, 2, 0], // Amaj7
  Bmaj7: [null, 2, 4, 3, 4, 2], // Bmaj7 - common shape
  Cm7: [null, 3, 5, 3, 4, 3], // Cm7 - Am7 shape barre 3rd fret
  Dm7: [null, null, 0, 2, 1, 1], // Dm7
  Em7: [0, 2, 2, 0, 3, 0], // Em7
  Fm7: [1, 3, 1, 1, 1, 1], // Fm7 - Em7 shape barre 1st fret
  Gm7: [3, 5, 3, 3, 3, 3], // Gm7 - Em7 shape barre 3rd fret
  Am7: [null, 0, 2, 0, 1, 0], // Am7
  Bm7: [null, 2, 4, 2, 3, 2], // Bm7 - Am7 shape barre 2nd fret
  '1': [null, 3, 2, 0, 1, 0], // C
  '2': [null, null, 0, 2, 3, 1], // Dm
  '3': [0, 2, 2, 0, 0, 0], // Em
  '4': [null, 3, 3, 2, 1, 1], // F (using A shape barre on 8th fret or E shape on 1st fret)
  '5': [3, 2, 0, 0, 0, 3], // G
  '6': [null, 0, 2, 2, 1, 0], // Am
  '7': [null, 2, 1, 2, null, 2], // Bdim or Bm7b5
  '1m': [null, 3, 5, 5, 4, 3], // Cm
  '2m': [null, null, 0, 2, 3, 1], // Dm
  '3m': [0, 2, 2, 0, 0, 0], // Em
  '4m': [1, 3, 3, 1, 1, 1], // Fm
  '5m': [3, 5, 5, 3, 3, 3], // Gm
  '6m': [null, 0, 2, 2, 1, 0], // Am
  '7m': [null, 2, 4, 4, 3, 2], // Bm
  '1maj7': [null, 3, 2, 0, 0, 0], // Cmaj7
  '2maj7': [null, null, 0, 2, 2, 2], // Dmaj7
  '3maj7': [0, 2, 1, 1, 0, 0], // Emaj7
  '4maj7': [1, 3, 3, 2, 1, 1], // Fmaj7
  '5maj7': [3, 2, 0, 0, 0, 2], // Gmaj7
  '6maj7': [null, 0, 2, 1, 2, 0], // Amaj7
  '7maj7': [null, 2, 4, 3, 4, 2], // Bmaj7
  '1m7': [null, 3, 5, 3, 4, 3], // Cm7
  '2m7': [null, null, 0, 2, 1, 1], // Dm7
  '3m7': [0, 2, 2, 0, 3, 0], // Em7
  '4m7': [1, 3, 1, 1, 1, 1], // Fm7
  '5m7': [3, 5, 3, 3, 3, 3], // Gm7
  '6m7': [null, 0, 2, 0, 1, 0], // Am7
  '7m7': [null, 2, 4, 2, 3, 2], // Bm7
};

export const useGuitarStore = defineStore('guitar', () => {
  // 定义吉他调弦，key为弦顺序 (从粗到细，6到1)，value为开放弦音高 (MIDI值)
  // E2 A2 D3 G3 B3 E4
  const guitarTuningMidis: Record<number, number> = {
    6: 40, // E2
    5: 45, // A2
    4: 50, // D3
    3: 55, // G3
    2: 59, // B3
    1: 64, // E4
  };

  // 使用 ref 来存储高亮显示的品位/弦组合
  const melodyHighlightedPositions = ref<GuitarPosition[]>([]);
  const chordHighlightedPositions = ref<GuitarPosition[]>([]);

  const { transpose, noteNameToMidi, midiToNoteName } = useTone();

  // 计算属性，根据当前高亮位置和音符查找对应的品位/弦
  // 这用于在吉他指板上显示高亮圆点
  const highlightPositions = computed(() => [
    ...melodyHighlightedPositions.value,
    ...chordHighlightedPositions.value,
  ]);

  /**
   * 根据吉他和弦符号处理高亮和返回播放音高
   * @param {string[]} chordSymbols - 和弦符号数组
   * @returns {string[]} 需要播放的音高数组 (absolute pitches)
   */
  function processChord(chordSymbols: string[]): string[] {
    const notesToPlay: string[] = [];
    const positionsToHighlight: GuitarPosition[] = [];

    chordSymbols.forEach((symbol) => {
      if (guitarChordPositionsMap[symbol]) {
        const fretPositions = guitarChordPositionsMap[symbol];
        const chordNotes: string[] = [];

        fretPositions.forEach((fret, stringIndex) => {
          const stringNumber = 6 - stringIndex; // Convert 0-5 index to 6-1 string number
          if (fret !== null) {
            const openNote = guitarTuning[stringNumber];
            if (openNote) {
              const openMidi = noteNameToMidi(openNote);
              const playedMidi = openMidi + fret; // Note MIDI without transpose
              const playedNoteName = midiToNoteName(playedMidi);
              chordNotes.push(playedNoteName);

              // Add to positions to highlight
              const transposedFret = fret + transpose.value;
              positionsToHighlight.push({
                string: stringNumber,
                fret: transposedFret,
              });
            }
          }
        });

        // notesToPlay will contain all notes from all symbols in the chordSymbols array
        notesToPlay.push(...chordNotes);
      }
    });

    // Set unique positions to highlight
    const uniquePositionsMap = new Map<string, GuitarPosition>();
    positionsToHighlight.forEach((pos) => {
      if (pos.fret >= 0) {
        uniquePositionsMap.set(`${pos.string}-${pos.fret}`, pos);
      }
    });
    setHighlightPositions(Array.from(uniquePositionsMap.values()), 'chord');

    // Return unique notes to play (absolute pitches, transpose applied in playNote in PanelOperate)
    return Array.from(new Set(notesToPlay));
  }

  /**
   * 设置需要高亮的品位/弦组合
   * @param {GuitarPosition[]} positions - 需要高亮的品位/弦数组。
   * @param {'melody' | 'chord'} type - 高亮类型：'melody' 或 'chord'。
   * @returns {void}
   */
  function setHighlightPositions(
    positions: GuitarPosition[],
    type: 'melody' | 'chord',
  ) {
    if (type === 'melody') {
      melodyHighlightedPositions.value = positions;
    } else if (type === 'chord') {
      chordHighlightedPositions.value = positions;
    }
  }

  /**
   * 设置需要高亮的吉他位置 (基于 MIDI 数组)，优先选择低品位或 capo 后的品位。
   * 根据吉他记谱习惯（实际发音低一个八度），对输入的 MIDI 值进行调整。
   * @param {number[]} midis - 需要高亮的音符MIDI值数组。
   * @returns {void} - 更新 store 的 melodyHighlightedPositions。
   */
  function setHighlightMidis(midis: number[]) {
    const positionsToHighlight: GuitarPosition[] = [];
    let usePreferredPositions = true; // 标志，假定可以使用优先位置

    // 首先尝试为所有 MIDI 音符找到优先位置
    const potentialPreferredPositions: GuitarPosition[] = [];
    for (const midi of midis) {
      // 根据吉他记谱音高比实际发音高一个八度的约定，将输入的 MIDI 值减去 12
      const actualSoundingMidi = midi - 12;

      const preferred = SNTransition.Guitar.findPreferredPositionsForMidi(
        actualSoundingMidi,
        transpose.value,
      ); // 使用调整后的 MIDI 值查找优先位置
      if (preferred.length === 0) {
        // 如果任何一个音符在优先区域找不到位置，则不使用优先位置，改用所有位置
        usePreferredPositions = false;
        break; // 跳出循环
      }
      potentialPreferredPositions.push(...preferred); // 收集找到的优先位置
    }

    if (usePreferredPositions) {
      // 如果所有音符都能在优先区域找到位置，则使用这些位置
      positionsToHighlight.push(...potentialPreferredPositions);
    } else {
      // 如果有音符在优先区域找不到位置，则查找所有音符的所有可能位置
      for (const midi of midis) {
        // 同样使用调整后的 MIDI 值查找所有位置
        const actualSoundingMidi = midi - 12;
        positionsToHighlight.push(
          ...SNTransition.Guitar.findAllPositionsForMidi(actualSoundingMidi),
        );
      }
    }

    // 确保高亮位置的唯一性
    const uniquePositionsMap = new Map<string, GuitarPosition>();
    positionsToHighlight.forEach((pos) => {
      // 只有当计算出的品位不小于当前的 transpose 值时才考虑高亮
      // 这是为了避免在 capo 左侧显示高亮，除非是空弦 (fret 0)
      if (pos.fret >= transpose.value || pos.fret === 0) {
        uniquePositionsMap.set(`${pos.string}-${pos.fret}`, pos);
      }
    });
    setHighlightPositions(Array.from(uniquePositionsMap.values()), 'melody');
  }

  /**
   * 清除所有旋律高亮。
   * @returns {void}
   */
  function clearMelodyHighlightMidis() {
    melodyHighlightedPositions.value = [];
  }

  /**
   * 清除所有和弦高亮。
   * @returns {void}
   */
  function clearChordHighlightMidis() {
    chordHighlightedPositions.value = [];
  }

  return {
    guitarTuningMidis,
    highlightPositions,
    melodyHighlightedPositions,
    chordHighlightedPositions,
    processChord,
    setHighlightPositions,
    setHighlightMidis,
    clearMelodyHighlightMidis,
    clearChordHighlightMidis,
    transpose,
  };
});
