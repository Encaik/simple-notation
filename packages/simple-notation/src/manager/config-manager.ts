import { LayoutConfig } from './config/layout-config';
import { ScoreConfig } from './config/score-config';
import type { SNLayoutConfig, SNScoreConfig } from '@manager/model';

/**
 * 配置管理器
 *
 * 负责管理整个库的配置项，作为配置类的总管。
 * 支持通过 get/set 方法获取和设置某个分类的配置。
 *
 * 设计理念：
 * - ConfigManager 只负责管理配置实例，不包含具体的配置逻辑
 * - 每个配置类（LayoutConfig、ScoreConfig）负责自己的默认值和合并逻辑
 * - 支持缺省配置和部分字段配置
 * - 配置类可以独立使用，也可以通过 ConfigManager 统一管理
 *
 * @example
 * ```typescript
 * // 完全缺省，使用默认配置
 * const configManager = new ConfigManager();
 *
 * // 只配置布局
 * const configManager = new ConfigManager({
 *   layout: {
 *     global: { size: { width: 1200, height: 800 } }
 *   }
 * });
 *
 * // 只配置乐谱
 * const configManager = new ConfigManager({
 *   score: {
 *     element: { note: { style: { color: '#ff0000' } } }
 *   }
 * });
 *
 * // 获取布局配置
 * const layoutConfig = configManager.getLayout();
 * const globalConfig = layoutConfig.getGlobal();
 *
 * // 更新布局配置
 * configManager.getLayout().setGlobal({ size: { width: 1000 } });
 * ```
 */
export class ConfigManager {
  /** 布局配置实例 */
  private readonly layoutConfig: LayoutConfig;

  /** 乐谱配置实例 */
  private readonly scoreConfig: ScoreConfig;

  /**
   * 创建配置管理器
   *
   * @param config - 配置对象（可选）
   */
  constructor(config?: {
    layout?: Partial<SNLayoutConfig>;
    score?: Partial<SNScoreConfig>;
  }) {
    this.layoutConfig = new LayoutConfig(config?.layout);
    this.scoreConfig = new ScoreConfig(config?.score);
  }

  /**
   * 获取布局配置实例
   *
   * @returns 布局配置实例
   */
  getLayout(): LayoutConfig {
    return this.layoutConfig;
  }

  /**
   * 获取乐谱配置实例
   *
   * @returns 乐谱配置实例
   */
  getScore(): ScoreConfig {
    return this.scoreConfig;
  }

  /**
   * 更新布局配置
   *
   * @param config - 部分布局配置
   */
  setLayout(config: Partial<SNLayoutConfig>): void {
    this.layoutConfig.set(config);
  }

  /**
   * 更新乐谱配置
   *
   * @param config - 部分乐谱配置
   */
  setScore(config: Partial<SNScoreConfig>): void {
    this.scoreConfig.set(config);
  }

  /**
   * 获取所有布局配置（只读）
   *
   * @returns 完整的布局配置
   */
  getLayoutConfig(): Readonly<SNLayoutConfig> {
    return this.layoutConfig.get();
  }

  /**
   * 获取所有乐谱配置（只读）
   *
   * @returns 完整的乐谱配置
   */
  getScoreConfig(): Readonly<SNScoreConfig> {
    return this.scoreConfig.get();
  }

  /**
   * 重置布局配置为默认值
   */
  resetLayout(): void {
    this.layoutConfig.reset(LayoutConfig.getDefault());
  }

  /**
   * 重置乐谱配置为默认值
   */
  resetScore(): void {
    this.scoreConfig.reset(ScoreConfig.getDefault());
  }
}
