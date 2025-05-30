/**
 * 表示吉他指板上的特定位置。
 */
export interface GuitarPosition {
  string: number; // 吉他弦号 (6到1)
  fret: number; // 品位号 (0代表空弦)
}

// 定义基本映射 (可以从其他文件移过来)
export const scaleMap = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const transposeKeyMap: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

// 吉他调音和和弦位置映射
export const guitarTuningMidis: Record<number, number> = {
  6: 40, // E2
  5: 45, // A2
  4: 50, // D3
  3: 55, // G3
  2: 59, // B3
  1: 64, // E4
};

export const guitarTuning: Record<number, string> = {
  6: 'E2', // Low E 低音 E
  5: 'A2', // A
  4: 'D3', // D
  3: 'G3', // G
  2: 'B3', // B
  1: 'E4', // High E 高音 E
};

// 简化和弦位置映射 (后续可以根据 SNChordLayer 扩展)
// 键是和弦符号，值是每根弦（6到1）的品位数组
// null 表示不弹该弦
export const guitarChordPositionsMap: Record<string, (number | null)[]> = {
  C: [null, 3, 2, 0, 1, 0], // C
  D: [null, null, 0, 2, 3, 2], // D
  E: [0, 2, 2, 1, 0, 0], // E
  F: [1, 3, 3, 2, 1, 1], // F
  G: [3, 2, 0, 0, 0, 3], // G
  A: [null, 0, 2, 2, 2, 0], // A
  B: [null, 2, 4, 4, 4, 2], // B
  Am: [null, 0, 2, 2, 1, 0], // Am
  Dm: [null, null, 0, 2, 3, 1], // Dm
  Em: [0, 2, 2, 0, 0, 0], // Em
  Fm: [1, 3, 3, 1, 1, 1], // Fm
  Gm: [3, 5, 5, 3, 3, 3], // Gm
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
  '4': [null, 3, 3, 2, 1, 1], // F (using A shape barre on 8th fret or E shape on 1st fret)
  '5': [3, 2, 0, 0, 0, 3], // G
  '6': [null, 0, 2, 2, 1, 0], // Am
  '7': [null, 2, 1, 2, null, 2], // Bdim or Bm7b5
  '1m': [null, 3, 5, 5, 4, 3], // Cm
  '2m': [null, null, 0, 2, 3, 1], // Dm
  '3m': [0, 2, 2, 0, 0, 0], // Em
  '4m': [1, 3, 3, 1, 1, 1], // Fm
  '5m': [3, 5, 5, 3, 3, 3], // Gm
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
  '3m7': [0, 2, 2, 0, 3, 0], // Em7
  '4m7': [1, 3, 1, 1, 1, 1], // Fm7
  '5m7': [3, 5, 3, 3, 3, 3], // Gm7
  '6m7': [null, 0, 2, 0, 1, 0], // Am7
  '7m7': [null, 2, 4, 2, 3, 2], // Bm7 - Am7 shape barre 2nd fret
};
