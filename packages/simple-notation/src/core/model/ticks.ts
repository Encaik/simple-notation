/**
 * 时间单位相关类型定义（整数 Ticks 方案）
 *
 * 使用整数 ticks 作为最小时间单位，类似 MIDI 标准，避免小数计算。
 * 所有时间相关的计算都基于整数 ticks，确保精确性和性能。
 */

/**
 * 持续时间（以 ticks 为单位的整数）
 *
 * 衡量标准（明确且统一）：
 * - ticksPerWhole: 全音符的 ticks 数（整数）
 * - duration: 以 ticks 为单位的整数
 *
 * 示例：如果 ticksPerWhole = 48（noteLength = 1/4 时），则：
 *   - 全音符 = 48 ticks（duration = 48）
 *   - 二分音符 = 24 ticks（duration = 24）
 *   - 四分音符 = 12 ticks（duration = 12）
 *   - 八分音符 = 6 ticks（duration = 6）
 *   - 十六分音符 = 3 ticks（duration = 3）
 *
 * 这样设计的好处：
 * 1. 所有计算都是整数，无小数，无精度损失
 * 2. 清晰明确：duration 就是 ticks 数
 * 3. 容易对齐：所有声部使用相同的 ticksPerWhole，直接比较 duration 值即可
 * 4. 容易验证：计算小节内所有 duration 之和，应该等于小节的完整时长
 * 5. 性能最优：纯整数运算，比小数运算更快
 */
export type SNDuration = number;

/**
 * 时间单位配置（整数 Ticks 方案）
 *
 * 使用整数 ticks 作为最小时间单位，类似 MIDI 标准，避免小数计算。
 *
 * 衡量标准（明确且统一）：
 * - ticksPerWhole: 全音符的 ticks 数（整数）
 * - ticksPerBeat: 每拍的 ticks 数（整数）
 * - duration: 以 ticks 为单位的整数
 *
 * 所有音符、休止符、歌词等的 duration 都用 ticks 表示。
 *
 * @example
 * // noteLength = 1/4 时的配置
 * {
 *   ticksPerWhole: 48,  // 全音符 = 48 ticks
 *   ticksPerBeat: 12    // 一拍 = 12 ticks（4/4 拍）
 * }
 *
 * // noteLength = 1/8 时的配置
 * {
 *   ticksPerWhole: 96,  // 全音符 = 96 ticks
 *   ticksPerBeat: 24    // 一拍 = 24 ticks（4/4 拍）
 * }
 */
export interface SNTimeUnit {
  /**
   * 全音符的 ticks 数（整数）
   *
   * 这是全音符被分成多少个 ticks，所有 duration 都是这个 ticks 的整数倍。
   *
   * 例如：
   *   - 如果 noteLength = 1/4，通常使用 48（四分音符 = 12 ticks）
   *   - 如果 noteLength = 1/8，通常使用 96（八分音符 = 12 ticks）
   *
   * 根据 noteLength 动态计算，确保常见音符的 ticks 值较小且精确。
   */
  ticksPerWhole: number; // 整数，例如：48, 96, 192

  /**
   * 每拍的 ticks 数（整数）
   *
   * 由拍号的 denominator 决定，用于将 ticks 转换为拍数。
   *
   * 例如：
   *   - 4/4 拍：ticksPerBeat = 12（如果 ticksPerWhole = 48）
   *   - 3/8 拍：ticksPerBeat = 12（如果 ticksPerWhole = 96）
   *   - 2/2 拍：ticksPerBeat = 24（如果 ticksPerWhole = 48）
   *
   * 计算：ticksPerBeat = ticksPerWhole / timeSignature.denominator
   */
  ticksPerBeat: number; // 整数，自动根据 timeSignature 计算
}
