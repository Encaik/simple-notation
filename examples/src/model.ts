/**
 * 钢琴键数据结构
 */
export interface PianoKey {
  index: number; // 1-88
  note: string; // 如A0, C4
  type: 'white' | 'black';
  midi: number; // 21-108
}

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
