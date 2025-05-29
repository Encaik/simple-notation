import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { PianoKey } from '../model';

export const usePianoStore = defineStore('piano', () => {
  const keys = ref<PianoKey[]>([]);
  const activeMidis = ref<number[]>([]);

  const highlightMidis = computed(() => activeMidis.value);

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
   * @param {number[]} keyMidis - 需要高亮的Midi的索引数组（20-108）
   * @returns {void}
   */
  function setHighlightMidis(keyMidis: number[]) {
    activeMidis.value = keyMidis;
  }

  /**
   * 清除高亮
   * @returns {void}
   */
  function clearHighlightMidis() {
    activeMidis.value = [];
  }

  return {
    keys,
    whiteKeys,
    blackKeys,
    setKeys,
    activeMidis,
    highlightMidis,
    setHighlightMidis,
    clearHighlightMidis,
  };
});
