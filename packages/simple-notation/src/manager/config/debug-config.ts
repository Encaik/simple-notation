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
      enableBackgroundBoxes: true,
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

  /** 查询某层级是否启用背景框（未配置则继承全局） */
  isLayerBackgroundEnabled(
    layer: keyof NonNullable<SNDebugConfig['layers']>,
  ): boolean {
    const global = this.isBackgroundBoxEnabled();
    const layers = this.get().layers || {};
    const value = layers[layer];
    return typeof value === 'boolean' ? value : global;
  }
}

// 提供一个默认单例，供渲染层直接读取/变更
export const DebugConfigInstance = new DebugConfig();
