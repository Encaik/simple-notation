// 定义钢琴和弦映射表，key为和弦名，value为音高字符串数组
export const pianoChordMap: Record<string, string[]> = {
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

// Simplified guitar chord positions map (can be expanded later based on SNChordLayer if needed)
// Key is chord symbol, value is array of fret numbers for each string (6 to 1)
// null means string is not played
export const guitarChordPositionsMap: Record<string, (number | null)[]> = {
  C: [null, 3, 2, 0, 1, 0], // C
  D: [null, null, 0, 2, 3, 2], // D
  E: [0, 2, 2, 1, 0, 0], // E
  F: [1, 3, 3, 2, 1, 1], // F
  G: [3, 2, 0, 0, 0, 3], // G
  A: [null, 0, 2, 2, 2, 0], // A
  B: [null, 2, 4, 4, 4, 2], // B
  Cm: [null, 3, 5, 5, 4, 3], // Cm
  Dm: [null, null, 0, 2, 3, 1], // Dm
  Em: [0, 2, 2, 0, 0, 0], // Em
  Fm: [1, 3, 3, 1, 1, 1], // Fm
  Gm: [3, 5, 5, 3, 3, 3], // Gm
  Am: [null, 0, 2, 2, 1, 0], // Am
  Bm: [null, 2, 4, 4, 3, 2], // Bm
  Cmaj7: [null, 3, 2, 0, 0, 0], // Cmaj7
  Dmaj7: [null, null, 0, 2, 2, 2], // Dmaj7
  Emaj7: [0, 2, 1, 1, 0, 0], // Emaj7
  Fmaj7: [1, 3, 3, 2, 1, 1], // Fmaj7 - using F barre shape
  Gmaj7: [3, 2, 0, 0, 0, 2], // Gmaj7
  Amaj7: [null, 0, 2, 1, 2, 0], // Amaj7
  Bmaj7: [null, 2, 4, 3, 4, 2], // Bmaj7 - common shape
  Cm7: [null, 3, 5, 3, 4, 3], // Cm7 - Am7 shape barre 3rd fret
  Dm7: [null, null, 0, 2, 1, 1], // Dm7
  Em7: [0, 2, 2, 0, 3, 0], // Em7
  Fm7: [1, 3, 1, 1, 1, 1], // Fm7 - Em7 shape barre 1st fret
  Gm7: [3, 5, 3, 3, 3, 3], // Gm7 - Em7 shape barre 3rd fret
  Am7: [null, 0, 2, 0, 1, 0], // Am7
  Bm7: [null, 2, 4, 2, 3, 2], // Bm7 - Am7 shape barre 2nd fret
  '1': [null, 3, 2, 0, 1, 0], // C
  '2': [null, null, 0, 2, 3, 1], // Dm
  '3': [0, 2, 2, 0, 0, 0], // Em
  '4': [1, 3, 3, 2, 1, 1], // F (using A shape barre on 8th fret or E shape on 1st fret)
  '5': [3, 2, 0, 0, 0, 3], // G
  '6': [null, 0, 2, 2, 1, 0], // Am
  '7': [null, 2, 1, 2, null, 2], // Bdim or Bm7b5
  '1m': [null, 3, 5, 5, 4, 3], // Cm
  '2m': [null, null, 0, 2, 3, 1], // Dm
  '3m': [0, 2, 2, 0, 0, 0], // Em
  '4m': [1, 3, 3, 1, 1, 1], // Fm
  '5m': [3, 5, 3, 3, 3, 3], // Gm
  '6m': [null, 0, 2, 2, 1, 0], // Am
  '7m': [null, 2, 4, 4, 3, 2], // Bm
  '1maj7': [null, 3, 2, 0, 0, 0], // Cmaj7
  '2maj7': [null, null, 0, 2, 2, 2], // Dmaj7
  '3maj7': [0, 2, 1, 1, 0, 0], // Emaj7
  '4maj7': [1, 3, 3, 2, 1, 1], // Fmaj7
  '5maj7': [3, 2, 0, 0, 0, 2], // Gmaj7
  '6maj7': [null, 0, 2, 1, 2, 0], // Amaj7
  '7maj7': [null, 2, 4, 3, 4, 2], // Bmaj7
  '1m7': [null, 3, 5, 3, 4, 3], // Cm7
  '2m7': [null, null, 0, 2, 1, 1], // Dm7
  '3m7': [0, 2, 2, 0, 3, 0], // Em7 // Corrected typo E2 to 0
  '4m7': [1, 3, 1, 1, 1, 1], // Fm7
  '5m7': [3, 5, 3, 3, 3, 3], // Gm7
  '6m7': [null, 0, 2, 0, 1, 0], // Am7
  '7m7': [null, 2, 4, 2, 3, 2], // Bm7
};

/**
 * 吉他调弦的音高 (MIDI值)。从粗到细，6弦到1弦。
 * E2 A2 D3 G3 B3 E4
 */
export const guitarTuningMidis: Record<number, number> = {
  6: 40, // E2
  5: 45, // A2
  4: 50, // D3
  3: 55, // G3
  2: 59, // B3
  1: 64, // E4
};

/**
 * 将和弦符号转换为对应的钢琴音高字符串数组。
 * @param chordSymbol 和弦符号 (例如 'C', 'Am', 'G7', '1', '2m')
 * @returns 对应的音高字符串数组 (例如 ['C3', 'E3', 'G3'])，如果找不到则返回空数组。
 */
export function getPianoNotesForChord(chordSymbol: string): string[] {
  return pianoChordMap[chordSymbol] || [];
}

/**
 * 将和弦符号转换为对应的吉他指板位置数组。
 * @param chordSymbol 和弦符号
 * @returns 对应的吉他指板位置数组 [{ string: number, fret: number | null }]，如果找不到则返回空数组。
 */
export function getGuitarPositionsForChord(
  chordSymbol: string,
): (number | null)[] {
  return guitarChordPositionsMap[chordSymbol] || [];
}

/**
 * 根据吉他指板位置获取对应的音高（MIDI值）。
 * @param string 弦号 (1-6)
 * @param fret 品位
 * @returns 音高 MIDI 值，如果弦号或品位无效则返回 null。
 */
export function getMidiForGuitarPosition(
  string: number,
  fret: number,
): number | null {
  const openStringMidi = guitarTuningMidis[string];
  if (openStringMidi === undefined) {
    return null;
  }
  // 实际弹奏的 MIDI 值
  const playedMidi = openStringMidi + fret;
  return playedMidi;
}

/**
 * 根据吉他指板位置获取对应的音名（带八度）。
 * @param string 弦号 (1-6)
 * @param fret 品位
 * @returns 音名字符串 (例如 'C3')，如果弦号或品位无效则返回 null。
 */
export function getNoteNameForGuitarPosition(
  string: number,
  fret: number,
): string | null {
  const midi = getMidiForGuitarPosition(string, fret);
  if (midi === null) {
    return null;
  }
  // 将 MIDI 值转换为音名。 Tone.js 的 midiToNoteName 函数在这里会用到。
  // 由于这个工具函数不直接依赖 Tone.js，这里只返回 MIDI，由外部调用者进行音名转换。
  // 或者，我们可以在这里引入一个简单的 MIDI 到音名转换逻辑，但不依赖 Tone.js
  // 为了保持这个工具文件的独立性，暂时不在这里进行 MIDI 到音名转换。
  // 外部调用者 (例如 Tone.js use hook) 会处理 MIDI 到音名的转换。

  // 示例：一个简化的 MIDI 到音名转换 (不使用 Tone.js)
  const noteNames = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ];
  const noteIndex = (midi - 12) % 12; // MIDI 0 是 C-1
  const octave = Math.floor((midi - 12) / 12);
  return noteNames[noteIndex] + octave;
}
