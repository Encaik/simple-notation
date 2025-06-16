/**
 * 表示吉他指板上的特定位置。
 */
export interface GuitarPosition {
  string: number; // 吉他弦号 (6到1)
  fret: number; // 品位号 (0代表空弦)
}
