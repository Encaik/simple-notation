import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { PianoKey } from '../model';

export const usePianoStore = defineStore('piano', () => {
  const keys = ref<PianoKey[]>([]);
  const activeKeys = ref<number[]>([]);

  const highlightKeys = computed(() => activeKeys.value);

  // 白键和黑键分组
  const whiteKeys = computed(() =>
    keys.value.filter((k) => k.type === 'white'),
  );
  const blackKeys = computed(() =>
    keys.value.filter((k) => k.type === 'black'),
  );

  /**
   * 设置钢琴键
   * @param {PianoKey[]} keys - 需要设置的钢琴键数组
   * @returns {void}
   */
  function setKeys(pianoKeys: PianoKey[]) {
    keys.value = pianoKeys;
  }

  /**
   * 高亮指定的钢琴键
   * @param {number[]} keyIndexes - 需要高亮的键的索引数组（1-88）
   * @returns {void}
   */
  function setHighlightKeys(keyIndexes: number[]) {
    activeKeys.value = keyIndexes;
  }

  /**
   * 清除高亮
   * @returns {void}
   */
  function clearHighlightKeys() {
    activeKeys.value = [];
  }

  return {
    keys,
    whiteKeys,
    blackKeys,
    setKeys,
    activeKeys,
    highlightKeys,
    setHighlightKeys,
    clearHighlightKeys,
  };
});
