import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useHarmonicaStore = defineStore('harmonica', () => {
  // 分开管理旋律和和弦的高亮音符
  const melodyHighlightNotes = ref<string[]>([]);
  const chordHighlightNotes = ref<string[]>([]);

  // 计算属性，合并旋律和和弦的高亮，供组件使用
  const highlightNotes = computed(() => [
    ...melodyHighlightNotes.value,
    ...chordHighlightNotes.value,
  ]);

  // 口琴和弦映射表，key 为和弦名，value 为记号数组（如 '1-blow', '2-draw' 等）
  const harmonicaChordMap: Record<string, string[]> = {
    // 大三和弦
    C: ['4-blow', '7-blow', '9-blow'],
    D: ['5-draw', '7-blow', '10-draw'],
    E: ['5-draw', '8-blow', '11-draw'],
    F: ['6-blow', '9-blow', '12-draw'],
    G: ['7-blow', '10-blow', '13-draw'],
    A: ['8-draw', '11-draw', '14-draw'],
    B: ['9-draw', '12-draw', '15-draw'],
    // 小三和弦
    Cm: ['4-blow', '7-draw', '9-blow'],
    Dm: ['5-draw', '7-draw', '10-draw'],
    Em: ['5-draw', '8-draw', '11-draw'],
    Fm: ['6-blow', '9-draw', '12-draw'],
    Gm: ['7-blow', '10-draw', '13-draw'],
    Am: ['8-draw', '11-draw', '14-draw'],
    Bm: ['9-draw', '12-draw', '15-draw'],
    // 大七和弦
    Cmaj7: ['4-blow', '7-blow', '9-blow', '11-blow'],
    Dmaj7: ['5-draw', '7-blow', '10-draw', '12-blow'],
    Emaj7: ['5-draw', '8-blow', '11-draw', '13-blow'],
    Fmaj7: ['6-blow', '9-blow', '12-draw', '14-blow'],
    Gmaj7: ['7-blow', '10-blow', '13-draw', '15-blow'],
    Amaj7: ['8-draw', '11-draw', '14-draw', '16-draw'],
    Bmaj7: ['9-draw', '12-draw', '15-draw', '17-draw'],
    // 小七和弦
    Cm7: ['4-blow', '7-draw', '9-blow', '11-draw'],
    Dm7: ['5-draw', '7-draw', '10-draw', '12-draw'],
    Em7: ['5-draw', '8-draw', '11-draw', '13-draw'],
    Fm7: ['6-blow', '9-draw', '12-draw', '14-draw'],
    Gm7: ['7-blow', '10-draw', '13-draw', '15-draw'],
    Am7: ['8-draw', '11-draw', '14-draw', '16-draw'],
    Bm7: ['9-draw', '12-draw', '15-draw', '17-draw'],
    // 数字和弦
    '1': ['4-blow', '7-blow', '9-blow'],
    '2': ['5-draw', '7-draw', '10-draw'],
    '3': ['5-draw', '8-draw', '11-draw'],
    '4': ['6-blow', '9-blow', '12-draw'],
    '5': ['7-blow', '10-blow', '13-draw'],
    '6': ['8-draw', '11-draw', '14-draw'],
    '7': ['9-draw', '12-draw', '15-draw'],
    // 数字小三和弦
    '1m': ['4-blow', '7-draw', '9-blow'],
    '2m': ['5-draw', '7-draw', '10-draw'],
    '3m': ['5-draw', '8-draw', '11-draw'],
    '4m': ['6-blow', '9-draw', '12-draw'],
    '5m': ['7-blow', '10-draw', '13-draw'],
    '6m': ['8-draw', '11-draw', '14-draw'],
    '7m': ['9-draw', '12-draw', '15-draw'],
    // 数字大七和弦
    '1maj7': ['4-blow', '7-blow', '9-blow', '11-blow'],
    '2maj7': ['5-draw', '7-blow', '10-draw', '12-blow'],
    '3maj7': ['5-draw', '8-blow', '11-draw', '13-blow'],
    '4maj7': ['6-blow', '9-blow', '12-draw', '14-blow'],
    '5maj7': ['7-blow', '10-blow', '13-draw', '15-blow'],
    '6maj7': ['8-draw', '11-draw', '14-draw', '16-draw'],
    '7maj7': ['9-draw', '12-draw', '15-draw', '17-draw'],
    // 数字小七和弦
    '1m7': ['4-blow', '7-draw', '9-blow', '11-draw'],
    '2m7': ['5-draw', '7-draw', '10-draw', '12-draw'],
    '3m7': ['5-draw', '8-draw', '11-draw', '13-draw'],
    '4m7': ['6-blow', '9-draw', '12-draw', '14-draw'],
    '5m7': ['7-blow', '10-draw', '13-draw', '15-draw'],
    '6m7': ['8-draw', '11-draw', '14-draw', '16-draw'],
    '7m7': ['9-draw', '12-draw', '15-draw', '17-draw'],
  };

  /**
   * 根据口琴和弦符号处理高亮
   * @param {string[]} chordSymbols - 和弦符号数组
   * @returns {string[]} 需要播放的音高数组
   */
  function processChord(chordSymbols: string[]): string[] {
    const notesToPlay: string[] = [];
    const notesToHighlight: string[] = [];

    chordSymbols.forEach((symbol) => {
      if (harmonicaChordMap[symbol]) {
        const notes = harmonicaChordMap[symbol];
        notesToHighlight.push(...notes);
      }
    });

    setHighlightNotes(Array.from(new Set(notesToHighlight)), 'chord');

    return notesToPlay;
  }

  /**
   * 设置高亮音符
   * @param {string[]} notes - 需要高亮的音符数组
   * @param {'melody' | 'chord'} type - 高亮类型：'melody' 或 'chord'
   */
  function setHighlightNotes(notes: string[], type: 'melody' | 'chord') {
    if (type === 'melody') {
      melodyHighlightNotes.value = notes;
    } else if (type === 'chord') {
      chordHighlightNotes.value = notes;
    }
  }

  /**
   * 清除旋律高亮
   */
  function clearMelodyHighlightNotes() {
    melodyHighlightNotes.value = [];
  }

  /**
   * 清除和弦高亮
   */
  function clearChordHighlightNotes() {
    chordHighlightNotes.value = [];
  }

  return {
    melodyHighlightNotes,
    chordHighlightNotes,
    highlightNotes,
    setHighlightNotes,
    clearMelodyHighlightNotes,
    clearChordHighlightNotes,
    processChord,
  };
});
