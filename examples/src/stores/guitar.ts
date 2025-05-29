import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * 吉他高亮位置类型
 * 表示一个需要在指板上高亮的点：{ string: number, fret: number }
 * string: 弦的索引 (从低音弦 E 开始，索引 6 到 高音弦 E，索引 1)
 * fret: 品的索引 (0 表示空弦，1 表示第一品，以此类推)
 */
export interface GuitarPosition {
  string: number;
  fret: number;
}

export const useGuitarStore = defineStore('guitar', () => {
  const highlightedPositions = ref<GuitarPosition[]>([]);

  function setHighlightPositions(positions: GuitarPosition[]) {
    highlightedPositions.value = positions;
  }

  /**
   * 设置需要高亮的吉他位置
   * @param {number[]} midis - 需要高亮的音符MIDI值数组
   * @returns {void}
   */
  function setHighlightKeys(midis: number[]) {
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

          if (fret >= 0 && fret <= 3) {
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
  function clearHighlightPositions() {
    highlightedPositions.value = [];
  }

  return {
    highlightedPositions: computed(() => highlightedPositions.value),
    setHighlightPositions,
    setHighlightKeys,
    clearHighlightPositions,
  };
});
