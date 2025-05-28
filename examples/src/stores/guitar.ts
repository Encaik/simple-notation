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

  /**
   * 设置需要高亮的吉他位置
   * @param {GuitarPosition[]} positions - 需要高亮的吉他位置数组
   * @returns {void}
   */
  function setHighlightPositions(positions: GuitarPosition[]) {
    highlightedPositions.value = positions;
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
    clearHighlightPositions,
  };
});
