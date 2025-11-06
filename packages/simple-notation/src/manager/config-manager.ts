import { LayoutConfig } from './config/layout-config';
import { ScoreConfig } from './config/score-config';
import { DebugConfig } from './config/debug-config';
import type {
  SNLayoutConfig,
  SNScoreConfig,
  SNDebugConfig,
} from '@manager/model';

/**
 * 配置管理器
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
 * // 只配置调试
 * const configManager = new ConfigManager({
 *   debug: {
 *     enableBackgroundBoxes: true,
 *     layers: { block: true }
 *   }
 * });
 *
 * // 获取布局配置
 * const layoutConfig = configManager.getLayout();
 * const globalConfig = layoutConfig.getGlobal();
 *
 * // 更新布局配置
 * configManager.getLayout().setGlobal({ size: { width: 1000 } });
 *
 * // 获取调试配置
 * const debugConfig = configManager.getDebug();
 * ```
 */
export class ConfigManager {
  /** 布局配置实例 */
  private readonly layoutConfig: LayoutConfig;

  /** 乐谱配置实例 */
  private readonly scoreConfig: ScoreConfig;

  /** 调试配置实例 */
  private readonly debugConfig: DebugConfig;

  /**
   * 创建配置管理器
   *
   * @param config - 配置对象（可选）
   */
  constructor(config?: {
    layout?: Partial<SNLayoutConfig>;
    score?: Partial<SNScoreConfig>;
    debug?: Partial<SNDebugConfig>;
  }) {
    this.layoutConfig = new LayoutConfig(config?.layout);
    this.scoreConfig = new ScoreConfig(config?.score);
    this.debugConfig = new DebugConfig(config?.debug);
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
   * 获取调试配置实例
   *
   * @returns 调试配置实例
   */
  getDebug(): DebugConfig {
    return this.debugConfig;
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
   * 更新调试配置
   *
   * @param config - 部分调试配置
   */
  setDebug(config: Partial<SNDebugConfig>): void {
    this.debugConfig.set(config);
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
   * 获取所有调试配置（只读）
   *
   * @returns 完整的调试配置
   */
  getDebugConfig(): Readonly<SNDebugConfig> {
    return this.debugConfig.get();
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

  /**
   * 重置调试配置为默认值
   */
  resetDebug(): void {
    this.debugConfig.reset(DebugConfig.getDefault());
  }
}
