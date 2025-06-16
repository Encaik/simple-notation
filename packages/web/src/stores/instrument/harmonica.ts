import { SNTransition } from 'simple-notation';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useHarmonicaStore = defineStore('harmonica', () => {
  // 分开管理旋律和和弦的高亮音符
  const melodyHighlightNotes = ref<string[]>([]);
  const chordHighlightNotes = ref<string[]>([]);
  // 口琴类型，支持在面板内切换
  const type = ref<'tremolo' | 'chromatic'>('tremolo');

  // 计算属性，合并旋律和和弦的高亮，供组件使用
  const highlightNotes = computed(() => [
    ...melodyHighlightNotes.value,
    ...chordHighlightNotes.value,
  ]);

  /**
   * 复音口琴24组音名，严格按图片排列
   * blow为吹音；draw为吸音
   */
  const tremoloHoles = [
    { blow: 'G2', draw: null },
    { blow: null, draw: 'D3' },
    { blow: 'C3', draw: null },
    { blow: null, draw: 'F3' },
    { blow: 'E3', draw: null },
    { blow: null, draw: 'A3' },
    { blow: 'G3', draw: null },
    { blow: null, draw: 'B3' },
    { blow: 'C4', draw: null },
    { blow: null, draw: 'D4' },
    { blow: 'E4', draw: null },
    { blow: null, draw: 'F4' },
    { blow: 'G4', draw: null },
    { blow: null, draw: 'A4' },
    { blow: 'C5', draw: null },
    { blow: null, draw: 'B4' },
    { blow: 'E5', draw: null },
    { blow: null, draw: 'D5' },
    { blow: 'G5', draw: null },
    { blow: null, draw: 'F5' },
    { blow: 'C6', draw: null },
    { blow: null, draw: 'A5' },
    { blow: 'E6', draw: null },
    { blow: null, draw: 'B5' },
  ];

  /**
   * 半音阶口琴12孔音名，严格按图片排列
   * blow/draw为吹/吸，[0]为主音，[1]为升半音（滑钮按下）
   */
  const chromaticHoles = [
    { blow: ['C3', 'Db3'], draw: ['D3', 'Eb3'] },
    { blow: ['E3', 'F3'], draw: ['F3', 'Gb3'] },
    { blow: ['G3', 'Ab3'], draw: ['A3', 'Bb3'] },
    { blow: ['C4', 'Db4'], draw: ['B3', 'C4'] },
    { blow: ['C4', 'Db4'], draw: ['D4', 'Eb4'] },
    { blow: ['E4', 'F4'], draw: ['F4', 'Gb4'] },
    { blow: ['G4', 'Ab4'], draw: ['A4', 'Bb4'] },
    { blow: ['C5', 'Db5'], draw: ['B4', 'C5'] },
    { blow: ['C5', 'Db5'], draw: ['D5', 'Eb5'] },
    { blow: ['E5', 'F5'], draw: ['F5', 'Gb5'] },
    { blow: ['G5', 'Ab5'], draw: ['A5', 'Bb5'] },
    { blow: ['C6', 'Db6'], draw: ['B5', 'C6'] },
  ];

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

  function setType(newType: 'tremolo' | 'chromatic') {
    type.value = newType;
    melodyHighlightNotes.value = [];
    chordHighlightNotes.value = [];
  }

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

    chordHighlightNotes.value = Array.from(new Set(notesToHighlight));

    return notesToPlay;
  }

  function setHighlightNotes(notes: string[], type: 'melody' | 'chord') {
    if (type === 'melody') {
      melodyHighlightNotes.value = notes;
    } else if (type === 'chord') {
      chordHighlightNotes.value = notes;
    }
  }

  function midiToNote(midi: number): string {
    const noteName = SNTransition.General.midiToNoteName(midi);
    if (type.value === 'tremolo') {
      for (let index = 0; index < tremoloHoles.length; index++) {
        const hole = tremoloHoles[index];
        if (hole.blow === noteName) {
          return `${index}-blow`;
        } else if (hole.draw === noteName) {
          return `${index}-draw`;
        }
      }
    } else if (type.value === 'chromatic') {
      for (let index = 0; index < chromaticHoles.length; index++) {
        const hole = chromaticHoles[index];
        if (hole.blow.includes(noteName)) {
          return `${index}-blow`;
        } else if (hole.draw.includes(noteName)) {
          return `${index}-draw`;
        }
      }
    }
    return '';
  }

  function setHighlightMidis(midis: number[], type: 'melody' | 'chord' = 'melody') {
    const notes = midis.map((midi) => midiToNote(midi));
    setHighlightNotes(notes, type);
  }

  /**
   * 清除旋律高亮
   */
  function clearMelodyHighlightMidis() {
    melodyHighlightNotes.value = [];
  }

  /**
   * 清除和弦高亮
   */
  function clearChordHighlightMidis() {
    chordHighlightNotes.value = [];
  }

  return {
    type,
    tremoloHoles,
    chromaticHoles,
    melodyHighlightNotes,
    chordHighlightNotes,
    highlightNotes,
    setHighlightMidis,
    setHighlightNotes,
    clearMelodyHighlightMidis,
    clearChordHighlightMidis,
    processChord,
    setType,
  };
});
