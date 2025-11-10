import { SNPitch, SNDecoration } from '@core/model';
import { SNParserNode, SNParserChord } from '@data/node';

/**
 * 音符（Note）节点
 *
 * 表示一个音符，包含音高、时值、演奏方式等信息。
 *
 * 设计说明：
 * - pitch: 音高信息（音名、八度、变音记号）
 * - duration: 时值（以 ticks 为单位）
 * - articulation: 演奏方式（断奏、连奏、保持音等）
 * - chords: 关联的和弦标记（可选）
 * - decorations: 装饰符列表（颤音、波音、延音等）
 */
export class SNParserNote extends SNParserNode {
  /** 音高信息（音名、八度、变音记号） */
  pitch: SNPitch;
  /** 演奏方式（断奏、连奏、保持音等） */
  articulation?: 'staccato' | 'legato' | 'tenuto';
  /** 关联的和弦标记（可选，用于显示和弦符号） */
  chords?: SNParserChord;
  /** 装饰符列表（颤音、波音、延音等） */
  decorations?: SNDecoration[];

  /**
   * 创建音符节点
   *
   * @param id 节点唯一标识符
   * @param originStr 原始字符串（用于调试和追溯）
   * @param pitch 音高信息
   * @param duration 时值（以 ticks 为单位）
   */
  constructor({
    id,
    originStr,
    pitch,
    duration,
  }: Required<
    Pick<SNParserNode, 'id' | 'originStr' | 'duration'> & { pitch: SNPitch }
  >) {
    super({ id, originStr, type: 'note' });
    this.pitch = pitch;
    this.duration = duration;
  }
}
