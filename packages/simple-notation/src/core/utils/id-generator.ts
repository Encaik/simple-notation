/**
 * 统一的 ID 生成器工具
 *
 * 提供全局唯一 ID 生成功能，支持多种使用方式：
 * - 全局单例模式（默认）
 * - 独立实例模式（用于测试或多实例场景）
 */

/**
 * ID 生成器类
 */
class IdGenerator {
  private counter = 0;

  /**
   * 生成下一个 ID
   *
   * @param prefix - ID 前缀（如 'note', 'measure', 'section'）
   * @returns 生成的 ID（如 'note-1', 'measure-2'）
   */
  next(prefix: string): string {
    return `${prefix}-${++this.counter}`;
  }

  /**
   * 重置计数器（主要用于测试）
   */
  reset(): void {
    this.counter = 0;
  }

  /**
   * 获取当前计数器值
   */
  getCounter(): number {
    return this.counter;
  }
}

/**
 * 全局单例 ID 生成器
 */
const globalIdGenerator = new IdGenerator();

/**
 * 生成下一个全局唯一 ID
 *
 * @param prefix - ID 前缀（如 'note', 'measure', 'section'）
 * @returns 生成的 ID（如 'note-1', 'measure-2'）
 *
 * @example
 * ```typescript
 * const noteId = generateId('note');      // 'note-1'
 * const measureId = generateId('measure'); // 'measure-2'
 * const restId = generateId('rest');       // 'rest-3'
 * ```
 */
export function generateId(prefix: string): string {
  return globalIdGenerator.next(prefix);
}

/**
 * 重置全局 ID 计数器（主要用于测试）
 *
 * @example
 * ```typescript
 * resetIdCounter();
 * const id1 = generateId('note'); // 'note-1'
 * const id2 = generateId('note'); // 'note-2'
 * ```
 */
export function resetIdCounter(): void {
  globalIdGenerator.reset();
}

/**
 * 获取当前全局 ID 计数器值
 *
 * @returns 当前计数器值
 */
export function getIdCounter(): number {
  return globalIdGenerator.getCounter();
}

/**
 * 创建独立的 ID 生成器实例
 *
 * 用于需要独立 ID 命名空间的场景（如测试、多实例）
 *
 * @returns ID 生成器实例
 *
 * @example
 * ```typescript
 * const gen1 = createIdGenerator();
 * const gen2 = createIdGenerator();
 *
 * gen1.next('note'); // 'note-1'
 * gen1.next('note'); // 'note-2'
 * gen2.next('note'); // 'note-1' (独立计数)
 * ```
 */
export function createIdGenerator(): IdGenerator {
  return new IdGenerator();
}

/**
 * 导出类型（用于类型声明）
 */
export type { IdGenerator };
