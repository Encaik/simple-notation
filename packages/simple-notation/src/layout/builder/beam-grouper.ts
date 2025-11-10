import type { SNParserNode } from '@data/node';
import type { SNTimeUnit } from '@core/model/ticks';

/**
 * 符杠组信息
 */
export interface BeamGroup {
  /** 符杠组ID */
  id: string;
  /** 组内音符的索引 */
  noteIndices: number[];
  /** 符杠数量（取组内最多符尾的音符） */
  beamCount: number;
}

/**
 * 符杠分组器
 *
 * 职责：识别小节内可以用符杠连接的音符组
 * 规则：
 * 1. 只有八分音符或更短的音符才需要符杠
 * 2. 连续的这类音符如果在同一拍内，应该连接在一起
 * 3. 一拍的长度取决于拍号
 */
export class BeamGrouper {
  /**
   * 识别小节内的符杠组
   *
   * @param elements - 小节内的所有元素（包括 note、rest、tie 等）
   * @param timeUnit - 时间单位配置
   * @returns 符杠组数组
   */
  static groupBeams(
    elements: SNParserNode[],
    timeUnit: SNTimeUnit,
  ): BeamGroup[] {
    const groups: BeamGroup[] = [];
    let currentGroup: number[] = [];
    let groupIdCounter = 0;

    // 一拍的 ticks 数
    const ticksPerBeat = timeUnit.ticksPerBeat;
    // 四分音符的 ticks 数
    const quarterNoteTicks = timeUnit.ticksPerWhole / 4;

    // 当前累计的 ticks（用于判断是否到达拍边界）
    let currentTicks = 0;
    // 当前拍的起始 ticks
    let beatStartTicks = 0;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const duration = element.duration || 0;

      // 只处理音符类型
      if (element.type !== 'note') {
        // 遇到非音符元素，结束当前组
        if (currentGroup.length >= 2) {
          groups.push(
            this.createBeamGroup(
              currentGroup,
              elements,
              groupIdCounter++,
              timeUnit,
            ),
          );
        }
        currentGroup = [];
        currentTicks += duration;
        // 更新拍起始位置
        beatStartTicks = Math.floor(currentTicks / ticksPerBeat) * ticksPerBeat;
        continue;
      }

      // 检查是否需要符杠（八分音符或更短）
      const needsBeam = duration > 0 && duration < quarterNoteTicks;

      if (!needsBeam) {
        // 不需要符杠的音符，结束当前组
        if (currentGroup.length >= 2) {
          groups.push(
            this.createBeamGroup(
              currentGroup,
              elements,
              groupIdCounter++,
              timeUnit,
            ),
          );
        }
        currentGroup = [];
        currentTicks += duration;
        // 更新拍起始位置
        beatStartTicks = Math.floor(currentTicks / ticksPerBeat) * ticksPerBeat;
        continue;
      }

      // 检查当前音符的起始位置是否在新的一拍
      const currentBeatStartTicks =
        Math.floor(currentTicks / ticksPerBeat) * ticksPerBeat;

      // 如果当前音符起始位置在新的一拍，结束当前组
      if (currentBeatStartTicks > beatStartTicks) {
        // 先结束当前组（如果有）
        if (currentGroup.length >= 2) {
          groups.push(
            this.createBeamGroup(
              currentGroup,
              elements,
              groupIdCounter++,
              timeUnit,
            ),
          );
        }
        // 开始新组
        currentGroup = [];
        beatStartTicks = currentBeatStartTicks;
      }

      // 将当前音符加入当前组
      currentGroup.push(i);

      currentTicks += duration;
    }

    // 处理最后一组
    if (currentGroup.length >= 2) {
      groups.push(
        this.createBeamGroup(
          currentGroup,
          elements,
          groupIdCounter++,
          timeUnit,
        ),
      );
    }

    return groups;
  }

  /**
   * 创建符杠组对象
   *
   * @param noteIndices - 音符索引数组
   * @param elements - 所有元素
   * @param groupId - 组ID
   * @param timeUnit - 时间单位配置
   * @returns 符杠组对象
   */
  private static createBeamGroup(
    noteIndices: number[],
    elements: SNParserNode[],
    groupId: number,
    timeUnit: SNTimeUnit,
  ): BeamGroup {
    // 计算符杠数量（取组内最多符尾的音符）
    let maxBeamCount = 0;
    const quarterNoteTicks = timeUnit.ticksPerWhole / 4;

    for (const index of noteIndices) {
      const element = elements[index];
      const duration = element.duration || 0;

      if (duration <= 0) continue;

      // 计算符尾数量
      let beamCount = 0;
      let currentDuration = quarterNoteTicks;
      while (currentDuration > duration && beamCount < 4) {
        currentDuration /= 2;
        beamCount++;
      }

      maxBeamCount = Math.max(maxBeamCount, beamCount);
    }

    return {
      id: `beam-${groupId}`,
      noteIndices,
      beamCount: maxBeamCount,
    };
  }
}
