import type { SNTimeUnit, SNTimeSignature, SNMusicProps } from '../model/base';
import type { SNParserNode } from '@data/node';

/**
 * 时间单位工具函数（整数 Ticks 方案）
 *
 * 衡量标准（明确且统一）：
 * - ticksPerWhole: 全音符的 ticks 数（整数）
 * - ticksPerBeat: 每拍的 ticks 数（整数）
 * - duration: 以 ticks 为单位的整数
 *
 * 例如：如果 ticksPerWhole = 48（noteLength = 1/4 时），则：
 *   - 全音符 = 48 ticks（duration = 48）
 *   - 二分音符 = 24 ticks（duration = 24）
 *   - 四分音符 = 12 ticks（duration = 12）
 *   - 八分音符 = 6 ticks（duration = 6，精确无四舍五入）
 *   - 十六分音符 = 3 ticks（duration = 3，精确）
 *   - 三连音（1/6）= 8 ticks（duration = 8，精确）
 *
 * 这样设计的好处：
 * 1. 所有计算都是整数，无小数，无精度损失
 * 2. 清晰明确：duration 就是 ticks 数
 * 3. 容易对齐：所有声部使用相同的 ticksPerWhole，直接比较 duration 值即可
 * 4. 容易验证：计算小节内所有 duration 之和，应该等于小节的完整时长
 * 5. 性能最优：纯整数运算，比小数运算更快
 */

/**
 * 将音符时值（相对于全音符的比例）转换为 duration（ticks）
 *
 * @param noteValue 音符时值（相对于全音符），例如：1/4（四分音符），1/8（八分音符）
 * @param timeUnit 时间单位配置
 * @returns duration（ticks 数，整数）
 *
 * @example
 * const timeUnit = { ticksPerWhole: 48, ticksPerBeat: 12 }; // noteLength = 1/4 时
 * noteValueToDuration(1/4, timeUnit) // 返回 12（四分音符 = 12 ticks，精确）
 * noteValueToDuration(1/8, timeUnit) // 返回 6（八分音符 = 6 ticks，精确）
 * noteValueToDuration(1/6, timeUnit) // 返回 8（三连音 = 8 ticks，精确）
 */
export function noteValueToDuration(
  noteValue: number,
  timeUnit: SNTimeUnit,
): number {
  // 计算 duration = noteValue * ticksPerWhole
  // 例如：noteValue = 1/4 = 0.25, ticksPerWhole = 48
  //      duration = 0.25 * 48 = 12（精确整数）
  const result = noteValue * timeUnit.ticksPerWhole;

  // 检查是否接近整数（处理浮点误差）
  const rounded = Math.round(result);
  const diff = Math.abs(result - rounded);

  // 如果误差很小（小于 1e-10），认为是精确的整数
  if (diff < 1e-10) {
    return rounded;
  }

  // 如果误差较大，说明 ticksPerWhole 可能不够大，应该警告
  console.warn(
    `Note value ${noteValue} cannot be exactly represented with ticksPerWhole ${timeUnit.ticksPerWhole}. ` +
      `Difference: ${diff}. Consider using a larger ticksPerWhole.`,
  );
  return rounded;
}

/**
 * 将 duration（ticks）转换回音符时值（相对于全音符的比例）
 *
 * @param duration duration 值（ticks 数，整数）
 * @param timeUnit 时间单位配置
 * @returns 音符时值（相对于全音符的比例）
 */
export function durationToNoteValue(
  duration: number,
  timeUnit: SNTimeUnit,
): number {
  return duration / timeUnit.ticksPerWhole;
}

/**
 * 将 duration（ticks）转换为拍数
 *
 * @param duration duration 值（ticks 数，整数）
 * @param timeUnit 时间单位配置
 * @returns 拍数
 */
export function durationToBeats(
  duration: number,
  timeUnit: SNTimeUnit,
): number {
  // 直接计算：拍数 = ticks / ticksPerBeat
  return duration / timeUnit.ticksPerBeat;
}

/**
 * 将拍数转换为 duration（ticks）
 *
 * @param beats 拍数
 * @param timeUnit 时间单位配置
 * @returns duration（ticks 数，整数）
 */
export function beatsToDuration(beats: number, timeUnit: SNTimeUnit): number {
  // 直接计算：ticks = 拍数 * ticksPerBeat
  return Math.round(beats * timeUnit.ticksPerBeat);
}

/**
 * 计算小节的总时长（ticks）
 *
 * @param timeSignature 拍号
 * @param timeUnit 时间单位配置
 * @returns 小节的总 duration（ticks 数，整数）
 */
export function measureDuration(
  timeSignature: SNTimeSignature,
  timeUnit: SNTimeUnit,
): number {
  // 小节时长 = 拍数 × 每拍的 ticks
  return timeSignature.numerator * timeUnit.ticksPerBeat;
}

/**
 * 计算音符在小节内的起始位置（ticks）
 *
 * @param previousDuration 前面所有元素的 duration（ticks）之和
 * @returns 起始位置（ticks）
 */
export function calculateStartPosition(previousDuration: number): number {
  return previousDuration;
}

/**
 * 计算音符的结束位置（ticks）
 *
 * @param startPosition 起始位置（ticks）
 * @param duration 音符的 duration（ticks）
 * @returns 结束位置（ticks）
 */
export function calculateEndPosition(
  startPosition: number,
  duration: number,
): number {
  return startPosition + duration;
}

/**
 * 检查两个元素是否在同一拍（用于对齐）
 *
 * @param position1 元素1的位置（ticks）
 * @param position2 元素2的位置（ticks）
 * @param timeUnit 时间单位配置
 * @returns 是否在同一拍
 */
export function isSameBeat(
  position1: number,
  position2: number,
  timeUnit: SNTimeUnit,
): boolean {
  const beats1 = durationToBeats(position1, timeUnit);
  const beats2 = durationToBeats(position2, timeUnit);
  return Math.floor(beats1) === Math.floor(beats2);
}

/**
 * 验证小节的时值是否正确
 *
 * @param totalDuration 小节内所有元素的 duration（ticks）之和
 * @param timeSignature 拍号
 * @param timeUnit 时间单位配置
 * @returns 验证结果：{ valid: boolean, expected: number, actual: number, error?: string }
 */
export function validateMeasureDuration(
  totalDuration: number,
  timeSignature: SNTimeSignature,
  timeUnit: SNTimeUnit,
): {
  valid: boolean;
  expected: number;
  actual: number;
  error?: string;
} {
  const expected = measureDuration(timeSignature, timeUnit);
  const actual = totalDuration;
  const valid = actual === expected;

  if (!valid) {
    const expectedBeats = durationToBeats(expected, timeUnit);
    const actualBeats = durationToBeats(actual, timeUnit);
    const error = `Measure duration mismatch: expected ${expected} ticks (${expectedBeats} beats), got ${actual} ticks (${actualBeats} beats)`;
    return { valid, expected, actual, error };
  }

  return { valid, expected, actual };
}

/**
 * 根据最短时值计算合适的 ticksPerWhole
 *
 * 设计思路：
 * - 每个乐谱都有最短时值的音符（如 ABC 的 L: 字段）
 * - 所有音符都是这个最短时值的倍数或分数（1倍、2倍、除以2等）
 * - ticksPerWhole 应该足够大，让常见音符的 ticks 值较小且精确
 *
 * @param minNoteValue 最短音符时值（相对于全音符的比例），例如 1/4, 1/8
 * @param timeSignature 拍号（用于计算 ticksPerBeat）
 * @returns 计算出的 timeUnit
 *
 * @example
 * // 如果最短时值是 1/4（四分音符）
 * calculateTimeUnitFromMinNote(1/4) // ticksPerWhole = 48，四分音符 = 12 ticks
 *
 * // 如果最短时值是 1/8（八分音符）
 * calculateTimeUnitFromMinNote(1/8) // ticksPerWhole = 96，八分音符 = 12 ticks
 */
export function calculateTimeUnitFromMinNote(
  minNoteValue: number,
  timeSignature?: SNTimeSignature,
): SNTimeUnit {
  // ticksPerWhole = (1 / minNoteValue) * 12
  // 12 = 2² × 3，可以精确表示：
  //   - 常见倍数：×1, ×2, ×4, ×8（都是 2 的幂次）
  //   - 常见分数：÷2, ÷4, ÷8（都是 2 的幂次）
  //   - 三连音：÷3, ÷6, ÷12（都包含 3）
  //
  // 例如：如果最短是 1/4
  //   ticksPerWhole = (1 / (1/4)) * 12 = 4 * 12 = 48
  //   - 四分音符（最短）= 12 ticks
  //   - 二分音符 = 24 ticks
  //   - 八分音符（最短/2）= 6 ticks（精确，无四舍五入）
  //   - 十六分音符（最短/4）= 3 ticks（精确）
  //   - 三连音（最短/3）= 4 ticks（精确）
  const ticksPerWhole = Math.round((1 / minNoteValue) * 12);

  // 计算 ticksPerBeat
  const ticksPerBeat = timeSignature
    ? Math.round(ticksPerWhole / timeSignature.denominator)
    : Math.round(ticksPerWhole / 4); // 默认 4/4 拍

  return {
    ticksPerWhole,
    ticksPerBeat,
  };
}

/**
 * 获取默认的 timeUnit（如果没有提供最短时值）
 *
 * @param timeSignature 拍号（可选，用于计算 ticksPerBeat）
 * @returns 默认的 timeUnit（假设最短时值为 1/4）
 */
export function getDefaultTimeUnit(
  timeSignature?: SNTimeSignature,
): SNTimeUnit {
  // 默认假设最短时值是 1/4（四分音符），这在大多数乐谱中很常见
  return calculateTimeUnitFromMinNote(1 / 4, timeSignature);
}

/**
 * 从节点树中获取 timeUnit（向上查找父节点）
 *
 * @param node 起始节点
 * @returns timeUnit，如果找不到则返回默认值
 */
export function getTimeUnitFromNode(node: SNParserNode): SNTimeUnit {
  let current: SNParserNode | undefined = node;

  // 向上查找，直到找到有 timeUnit 的节点
  while (current) {
    const props = current.props as SNMusicProps | undefined;
    if (props?.timeUnit) {
      return props.timeUnit;
    }
    current = current.parent;
  }

  // 如果找不到，尝试分析节点树找出最短时值
  const minNoteValue = analyzeMinNoteValueFromNode(node);
  if (minNoteValue) {
    const props = node.props as SNMusicProps | undefined;
    return calculateTimeUnitFromMinNote(minNoteValue, props?.timeSignature);
  }

  // 如果都找不到，返回默认值
  const props = node.props as SNMusicProps | undefined;
  const timeSignature = props?.timeSignature;
  return getDefaultTimeUnit(timeSignature);
}

/**
 * 分析节点树，找出最短的音符时值
 *
 * 优先从 meta 中获取 noteLength（ABC 格式），如果没有则遍历节点找出最小 duration
 *
 * @param node 起始节点（通常是 root 或 score）
 * @returns 最短音符时值（相对于全音符的比例），如果找不到则返回 undefined
 */
function analyzeMinNoteValueFromNode(node: SNParserNode): number | undefined {
  // 1. 优先从 meta 中获取 noteLength（ABC 格式：如 "1/4", "1/8"）
  let current: SNParserNode | undefined = node;
  while (current) {
    const meta = current.meta as { noteLength?: string } | undefined;
    if (meta?.noteLength) {
      const match = meta.noteLength.match(/^(\d+)\/(\d+)$/);
      if (match) {
        const [, num, den] = match.map(Number);
        return num / den; // 例如：1/4 = 0.25
      }
    }
    current = current.parent;
  }

  // 2. 如果 meta 中没有，尝试从解析后的节点中找出最短 duration
  // 但这需要知道当前的 timeUnit，形成循环依赖，所以暂时不实现
  // 实际使用中，应该在解析时就从 noteLength 计算出 timeUnit

  return undefined;
}
