import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { GuitarPosition } from '../model';
import { useTone } from '../use/useTone';

export const useGuitarStore = defineStore('guitar', () => {
  const highlightedPositions = ref<GuitarPosition[]>([]);

  const { transpose } = useTone();

  function setHighlightPositions(positions: GuitarPosition[]) {
    highlightedPositions.value = positions;
  }

  /**
   * 设置需要高亮的吉他位置
   * @param {number[]} midis - 需要高亮的音符MIDI值数组
   * @returns {void}
   */
  function setHighlightMidis(midis: number[]) {
    const openStringMidis: { [key: number]: number } = {
      6: 52,
      5: 57,
      4: 62,
      3: 67,
      2: 71,
      1: 74,
    };
    const maxFret = 17;

    highlightedPositions.value = midis
      .map((midi) => {
        for (let string = 6; string >= 1; string--) {
          const openMidi = openStringMidis[string];
          const fret = midi - openMidi;

          if (fret >= 0 && fret <= 3 + transpose.value) {
            return { string, fret };
          }
        }

        for (let string = 6; string >= 1; string--) {
          const openMidi = openStringMidis[string];
          const fret = midi - openMidi;

          if (fret >= 0 && fret <= maxFret) {
            return { string, fret };
          }
        }
        return { string: -1, fret: -1 };
      })
      .filter((position) => position.string !== -1);
  }

  /**
   * 清除所有高亮位置
   * @returns {void}
   */
  function clearHighlightMidis() {
    highlightedPositions.value = [];
  }

  return {
    highlightedPositions: computed(() => highlightedPositions.value),
    setHighlightPositions,
    setHighlightMidis,
    clearHighlightMidis,
  };
});
