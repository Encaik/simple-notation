import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { GuitarPosition } from '../../model';
import { useTone } from '../../use/useTone';
import { SNTransition, ChordTool } from 'simple-notation';

export const useGuitarStore = defineStore('guitar', () => {
  // 使用 ref 来存储高亮显示的品位/弦组合
  const melodyHighlightedPositions = ref<GuitarPosition[]>([]);
  const chordHighlightedPositions = ref<GuitarPosition[]>([]);

  const { transpose, midiToNoteName } = useTone();

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
    const chordNotes: string[] = [];

    chordSymbols.forEach((symbol) => {
      const fretPositions = ChordTool.getGuitarPositionsForChord(symbol);
      if (fretPositions.length > 0) {
        fretPositions.forEach((fret: number | null, stringIndex: number) => {
          const stringNumber = 6 - stringIndex; // Convert 0-5 index to 6-1 string number
          if (fret !== null) {
            const playedMidi = ChordTool.getMidiForGuitarPosition(stringNumber, fret);
            if (playedMidi !== null) {
              const playedNoteName = midiToNoteName(playedMidi);
              chordNotes.push(playedNoteName); // Note name without transpose

              // Add to positions to highlight
              positionsToHighlight.push({
                string: stringNumber,
                fret: fret + transpose.value,
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
    return Array.from(new Set(chordNotes)); // Return the collected note names
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
      // Adjust condition to handle capos correctly - highlight any fret >= 0 if it's a valid position
      // The transpose logic is handled when getting the MIDI from the position
      if (pos.fret >= 0) {
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

  /**
   * 设置需要高亮的品位/弦组合
   * @param {GuitarPosition[]} positions - 需要高亮的品位/弦数组。
   * @param {'melody' | 'chord'} type - 高亮类型：'melody' 或 'chord'。
   * @returns {void}
   */
  function setHighlightPositions(positions: GuitarPosition[], type: 'melody' | 'chord') {
    if (type === 'melody') {
      melodyHighlightedPositions.value = positions;
    } else if (type === 'chord') {
      chordHighlightedPositions.value = positions;
    }
  }

  return {
    melodyHighlightedPositions,
    chordHighlightedPositions,
    highlightPositions,
    processChord,
    setHighlightPositions,
    setHighlightMidis,
    clearMelodyHighlightMidis,
    clearChordHighlightMidis,
    transpose,
  };
});
