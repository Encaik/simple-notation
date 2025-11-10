import { SNTimeUnit } from '@core/model/ticks';

/**
 * 时间转换工具类
 *
 * 职责：处理 ABC 格式中的时间相关转换
 * - noteLength 转换为 TimeUnit
 * - 时值计算
 */
export class TimeConverter {
  /**
   * 将 ABC 的 noteLength（如 "1/4", "1/8"）转换为 SNTimeUnit
   *
   * 算法说明：
   * - ticksPerWhole = (1 / noteLength) * 12
   * - 支持三连音且常见音符都是整数 ticks
   * - 默认值：ticksPerWhole = 48, ticksPerBeat = 12
   *
   * @param noteLength - ABC 音符长度字符串（如 "1/4", "1/8"）
   * @param timeSignature - 拍号（可选），用于计算 ticksPerBeat
   * @returns 时间单位对象
   *
   * @example
   * ```typescript
   * // 基本用法
   * const timeUnit = TimeConverter.convertAbcNoteLengthToTimeUnit('1/4');
   * // { ticksPerWhole: 48, ticksPerBeat: 12 }
   *
   * // 带拍号
   * const timeUnit = TimeConverter.convertAbcNoteLengthToTimeUnit('1/8', { numerator: 3, denominator: 8 });
   * // { ticksPerWhole: 96, ticksPerBeat: 12 }
   * ```
   */
  static convertAbcNoteLengthToTimeUnit(
    noteLength: string,
    timeSignature?: { numerator: number; denominator: number },
  ): SNTimeUnit {
    const match = noteLength.match(/^(\d+)\/(\d+)$/);

    // 如果格式不匹配，返回默认值
    if (!match) {
      const ticksPerWhole = 48;
      const ticksPerBeat = timeSignature
        ? Math.round(ticksPerWhole / timeSignature.denominator)
        : 12;
      return { ticksPerWhole, ticksPerBeat };
    }

    const [, num, den] = match.map(Number);
    const noteValue = num / den;
    const ticksPerWhole = Math.round((1 / noteValue) * 12);
    const ticksPerBeat = timeSignature
      ? Math.round(ticksPerWhole / timeSignature.denominator)
      : Math.round(ticksPerWhole / 4);

    return { ticksPerWhole, ticksPerBeat };
  }

  /**
   * 更新 TimeUnit 的 ticksPerBeat（当拍号变化时）
   *
   * @param timeUnit - 当前时间单位
   * @param denominator - 新的拍号分母
   * @returns 更新后的时间单位
   */
  static updateTicksPerBeat(
    timeUnit: SNTimeUnit,
    denominator: number,
  ): SNTimeUnit {
    return {
      ...timeUnit,
      ticksPerBeat: Math.round(timeUnit.ticksPerWhole / denominator),
    };
  }
}
