import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { PianoKey } from '../../model';
import { useTone } from '../../use/useTone';
import { ChordTool } from '@utils';

export const usePianoStore = defineStore('piano', () => {
  const keys = ref<PianoKey[]>([]);
  // 分开管理旋律和和弦的高亮 MIDI
  const melodyHighlightMidis = ref<number[]>([]);
  const chordHighlightMidis = ref<number[]>([]);

  const { noteNameToMidi } = useTone();

  // 计算属性，合并旋律和和弦的高亮，供组件使用
  const highlightMidis = computed(() => [
    ...melodyHighlightMidis.value,
    ...chordHighlightMidis.value,
  ]);

  /**
   * 根据钢琴和弦符号处理高亮和返回播放音高
   * @param {string[]} chordSymbols - 和弦符号数组
   * @returns {string[]} 需要播放的音高数组
   */
  function processChord(chordSymbols: string[]): string[] {
    const notesToPlay: string[] = [];
    const midisToHighlight: number[] = [];

    chordSymbols.forEach((symbol) => {
      const notes = ChordTool.getPianoNotesForChord(symbol);
      if (notes.length > 0) {
        notesToPlay.push(...notes);
        // Explicitly type the result of map to number[]
        const midis: number[] = notes.map(noteNameToMidi);
        midisToHighlight.push(...midis);
      }
    });

    setHighlightMidis(Array.from(new Set(midisToHighlight)), 'chord');

    return notesToPlay;
  }

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
   * @param {number[]} keyMidis - 需要高亮的 Midi 的索引数组
   * @param {'melody' | 'chord'} type - 高亮类型：'melody' 或 'chord'
   * @returns {void}
   */
  function setHighlightMidis(
    keyMidis: number[],
    type: 'melody' | 'chord' = 'melody',
  ) {
    if (type === 'melody') {
      melodyHighlightMidis.value = keyMidis;
    } else if (type === 'chord') {
      chordHighlightMidis.value = keyMidis;
    }
  }

  /**
   * 清除旋律高亮
   * @returns {void}
   */
  function clearMelodyHighlightMidis() {
    melodyHighlightMidis.value = [];
  }

  /**
   * 清除和弦高亮
   * @returns {void}
   */
  function clearChordHighlightMidis() {
    chordHighlightMidis.value = [];
  }

  return {
    keys,
    whiteKeys,
    blackKeys,
    setKeys,
    melodyHighlightMidis,
    chordHighlightMidis,
    highlightMidis,
    setHighlightMidis,
    clearMelodyHighlightMidis,
    clearChordHighlightMidis,
    processChord,
  };
});
