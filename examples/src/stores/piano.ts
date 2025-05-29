import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { PianoKey } from '../model';
import { useTone } from '../use/useTone'; // Corrected import path relative to stores

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

  // 钢琴和弦映射表，key为和弦名，value为音高字符串数组
  // 从PanelOperate.vue迁移过来
  const chordMap: Record<string, string[]> = {
    // 大三和弦
    C: ['C3', 'E3', 'G3'],
    D: ['D3', 'F#3', 'A3'],
    E: ['E3', 'G#3', 'B3'],
    F: ['F3', 'A3', 'C4'],
    G: ['G3', 'B3', 'D4'],
    A: ['A3', 'C#4', 'E4'],
    B: ['B3', 'D#4', 'F#4'],
    // 小三和弦
    Cm: ['C3', 'Eb3', 'G3'],
    Dm: ['D3', 'F3', 'A3'],
    Em: ['E3', 'G3', 'B3'],
    Fm: ['F3', 'Ab3', 'C4'],
    Gm: ['G3', 'Bb3', 'D4'],
    Am: ['A3', 'C4', 'E4'],
    Bm: ['B3', 'D4', 'F#4'],
    // 大七和弦 maj7
    Cmaj7: ['C3', 'E3', 'G3', 'B3'],
    Dmaj7: ['D3', 'F#3', 'A3', 'C#4'],
    Emaj7: ['E3', 'G#3', 'B3', 'D#4'],
    Fmaj7: ['F3', 'A3', 'C4', 'E4'],
    Gmaj7: ['G3', 'B3', 'D4', 'F#4'],
    Amaj7: ['A3', 'C#4', 'E4', 'G#4'],
    Bmaj7: ['B3', 'D#4', 'F#4', 'A#4'],
    // 小七和弦 m7
    Cm7: ['C3', 'Eb3', 'G3', 'Bb3'],
    Dm7: ['D3', 'F3', 'A3', 'C4'],
    Em7: ['E3', 'G3', 'B3', 'D4'],
    Fm7: ['F3', 'Ab3', 'C4', 'Eb4'],
    Gm7: ['G3', 'Bb3', 'D4', 'F4'],
    Am7: ['A3', 'C4', 'E4', 'G4'],
    Bm7: ['B3', 'D4', 'F#4', 'A4'],
    // 数字和弦（C大调）
    '1': ['C3', 'E3', 'G3'],
    '2': ['D3', 'F3', 'A3'],
    '3': ['E3', 'G3', 'B3'],
    '4': ['F3', 'A3', 'C4'],
    '5': ['G3', 'B3', 'D4'],
    '6': ['A3', 'C4', 'E4'],
    '7': ['B3', 'D4', 'F#4'],
    // 数字小三和弦（C大调）
    '1m': ['C3', 'Eb3', 'G3'],
    '2m': ['D3', 'F3', 'A3'],
    '3m': ['E3', 'G3', 'B3'],
    '4m': ['F3', 'Ab3', 'C4'],
    '5m': ['G3', 'Bb3', 'D4'],
    '6m': ['A3', 'C4', 'E4'],
    '7m': ['B3', 'D4', 'F#4'],
    // 数字大七和弦
    '1maj7': ['C3', 'E3', 'G3', 'B3'],
    '2maj7': ['D3', 'F#3', 'A3', 'C#4'],
    '3maj7': ['E3', 'G#3', 'B3', 'D#4'],
    '4maj7': ['F3', 'A3', 'C4', 'E4'],
    '5maj7': ['G3', 'B3', 'D4', 'F#4'],
    '6maj7': ['A3', 'C#4', 'E4', 'G#4'],
    '7maj7': ['B3', 'D#4', 'F#4', 'A#4'],
    // 数字小七和弦
    '1m7': ['C3', 'Eb3', 'G3', 'Bb3'],
    '2m7': ['D3', 'F3', 'A3', 'C4'],
    '3m7': ['E3', 'G3', 'B3', 'D4'],
    '4m7': ['F3', 'Ab3', 'C4', 'Eb4'],
    '5m7': ['G3', 'Bb3', 'D4', 'F4'],
    '6m7': ['A3', 'C4', 'E4', 'G4'],
    '7m7': ['B3', 'D4', 'F#4', 'A4'],
  };

  /**
   * 根据钢琴和弦符号处理高亮和返回播放音高
   * @param {string[]} chordSymbols - 和弦符号数组
   * @returns {string[]} 需要播放的音高数组
   */
  function processChord(chordSymbols: string[]): string[] {
    const notesToPlay: string[] = [];
    const midisToHighlight: number[] = [];

    chordSymbols.forEach((symbol) => {
      if (chordMap[symbol]) {
        const notes = chordMap[symbol];
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
  function setHighlightMidis(keyMidis: number[], type: 'melody' | 'chord') {
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
