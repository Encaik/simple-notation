import { BaseConfig } from './base-config';
import type { SNDebugConfig } from '@manager/model/debug-config';

/**
 * 调试配置类
 *
 * 控制渲染层调试辅助（如背景框）是否启用
 */
export class DebugConfig extends BaseConfig<SNDebugConfig> {
  constructor(userConfig?: Partial<SNDebugConfig>) {
    super(DebugConfig.getDefault(), userConfig);
  }

  protected getDefaultConfig(): SNDebugConfig {
    return DebugConfig.getDefault();
  }

  static getDefault(): SNDebugConfig {
    return {
      enableBackgroundBoxes: false,
      layers: {
        root: true,
        page: true,
        block: true,
        line: true,
        element: true,
      },
    };
  }

  /** 是否启用背景框（整体开关） */
  isBackgroundBoxEnabled(): boolean {
    return !!this.get().enableBackgroundBoxes;
  }

  /** 查询某层级是否启用背景框（全局开关优先，未配置则继承全局） */
  isLayerBackgroundEnabled(
    layer: keyof NonNullable<SNDebugConfig['layers']>,
  ): boolean {
    // 全局开关优先：如果全局开关为 false，所有层级都关闭
    const global = this.isBackgroundBoxEnabled();
    if (!global) return false;
    // 全局开关为 true 时，检查层级配置
    const layers = this.get().layers || {};
    const value = layers[layer];
    // 如果层级明确设置则使用层级配置，否则继承全局配置（true）
    return typeof value === 'boolean' ? value : global;
  }
}

// 提供一个默认单例，供渲染层直接读取/变更
export const DebugConfigInstance = new DebugConfig();
