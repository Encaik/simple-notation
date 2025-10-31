/**
 * 配置基类
 *
 * 所有配置类的基类，提供通用的配置管理功能
 */
export abstract class BaseConfig<T> {
  /** 配置数据 */
  protected config: T;

  /**
   * 创建配置实例
   *
   * @param defaultConfig - 默认配置
   * @param userConfig - 用户配置（可选）
   */
  constructor(defaultConfig: T, userConfig?: Partial<T>) {
    this.config = this.mergeConfig(defaultConfig, userConfig);
  }

  /**
   * 获取配置（只读）
   *
   * @returns 完整的配置对象
   */
  get(): Readonly<T> {
    return this.config;
  }

  /**
   * 设置配置（部分更新）
   *
   * @param partialConfig - 部分配置
   */
  set(partialConfig: Partial<T>): void {
    this.config = this.mergeConfig(this.config, partialConfig);
  }

  /**
   * 重置为默认配置
   *
   * @param defaultConfig - 默认配置
   */
  reset(defaultConfig: T): void {
    this.config = { ...defaultConfig };
  }

  /**
   * 获取默认配置（由子类实现）
   *
   * @returns 默认配置对象
   */
  protected abstract getDefaultConfig(): T;

  /**
   * 深度合并配置对象
   *
   * @param defaultObj - 默认配置对象
   * @param userObj - 用户配置对象（可选）
   * @returns 合并后的配置对象
   */
  protected mergeConfig(defaultObj: T, userObj?: Partial<T>): T {
    if (!userObj) {
      return { ...defaultObj };
    }

    const result = { ...defaultObj };

    // 遍历用户配置的每个字段
    for (const key in userObj) {
      if (Object.prototype.hasOwnProperty.call(userObj, key)) {
        const userValue = userObj[key];
        const defaultValue = defaultObj[key as keyof T];

        // 如果是对象且不是数组，进行深度合并
        if (
          userValue !== null &&
          userValue !== undefined &&
          typeof userValue === 'object' &&
          !Array.isArray(userValue) &&
          typeof defaultValue === 'object' &&
          defaultValue !== null &&
          !Array.isArray(defaultValue)
        ) {
          (result as Record<string, unknown>)[key] = this.mergeConfig(
            defaultValue as T,
            userValue as Partial<T>,
          );
        } else if (userValue !== undefined) {
          // 否则直接使用用户值（如果提供）
          (result as Record<string, unknown>)[key] = userValue;
        }
      }
    }

    return result;
  }
}
