/**
 * 钢琴键数据结构
 */
export interface PianoKey {
  index: number; // 1-88
  note: string; // 如A0, C4
  type: 'white' | 'black';
  midi: number; // 21-108
}
