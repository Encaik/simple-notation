import { BaseConfig } from './base-config';
import type {
  SNLayoutConfig,
  SNLayoutGlobalConfig,
  SNLayoutPageConfig,
  SNLayoutBlockConfig,
  SNLayoutLineConfig,
  SNLayoutElementConfig,
} from '@manager/model';

/**
 * 布局配置类
 *
 * 管理布局层的配置：全局-页面-块/行/元素
 */
export class LayoutConfig extends BaseConfig<SNLayoutConfig> {
  /**
   * 创建布局配置实例
   *
   * @param userConfig - 用户配置（可选）
   */
  constructor(userConfig?: Partial<SNLayoutConfig>) {
    const defaultConfig = LayoutConfig.getDefault();
    super(defaultConfig, userConfig);
  }

  /**
   * 获取默认布局配置
   *
   * @returns 默认布局配置
   */
  protected getDefaultConfig(): SNLayoutConfig {
    return LayoutConfig.getDefault();
  }

  /**
   * 静态方法：获取默认布局配置
   *
   * @returns 默认布局配置
   */
  static getDefault(): SNLayoutConfig {
    return {
      global: {
        size: {
          width: null, // null 表示撑满容器，也可以设置为具体数值（如 800）来限制容器大小
          height: null, // null 表示撑满容器，也可以设置为具体数值（如 600）来限制容器大小
          autoHeight: true, // 自动调整高度以适应内容
        },
        style: {
          backgroundColor: '#ffffff',
        },
        spacing: {
          padding: { top: 20, right: 20, bottom: 20, left: 20 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      page: {
        enable: false,
        size: {
          width: 794, // A4 宽度
          height: 1123, // A4 高度
        },
        style: {
          backgroundColor: '#ffffff',
        },
        spacing: {
          margin: { top: 40, right: 40, bottom: 40, left: 40 },
          padding: { top: 20, right: 20, bottom: 20, left: 20 },
          pageGap: 20,
        },
        pageNumber: {
          enable: false,
          position: 'bottom',
          style: {
            fontSize: 12,
            fontFamily: 'Arial',
            color: '#000000',
          },
          format: '{page}',
        },
      },
      block: {
        size: {
          width: null,
          height: null,
        },
        style: {},
        spacing: {
          blockGap: 20,
        },
        layout: {
          direction: 'vertical',
          align: 'stretch',
          wrap: 'wrap',
        },
      },
      line: {
        size: {
          height: 50,
        },
        style: {},
        spacing: {
          lineGap: 10,
        },
        layout: {
          align: 'left',
          verticalAlign: 'middle',
        },
      },
      element: {
        size: {
          width: null,
          height: null,
        },
        style: {},
        spacing: {
          elementGap: 5,
        },
      },
    };
  }

  /**
   * 获取全局配置
   */
  getGlobal(): Readonly<SNLayoutGlobalConfig> {
    return this.get().global;
  }

  /**
   * 更新全局配置
   */
  setGlobal(config: Partial<SNLayoutGlobalConfig>): void {
    this.set({ global: { ...this.get().global, ...config } });
  }

  /**
   * 获取页面配置
   */
  getPage(): Readonly<SNLayoutPageConfig> {
    return this.get().page;
  }

  /**
   * 更新页面配置
   */
  setPage(config: Partial<SNLayoutPageConfig>): void {
    this.set({ page: { ...this.get().page, ...config } });
  }

  /**
   * 获取块配置
   */
  getBlock(): Readonly<SNLayoutBlockConfig> {
    return this.get().block;
  }

  /**
   * 更新块配置
   */
  setBlock(config: Partial<SNLayoutBlockConfig>): void {
    this.set({ block: { ...this.get().block, ...config } });
  }

  /**
   * 获取行配置
   */
  getLine(): Readonly<SNLayoutLineConfig> {
    return this.get().line;
  }

  /**
   * 更新行配置
   */
  setLine(config: Partial<SNLayoutLineConfig>): void {
    this.set({ line: { ...this.get().line, ...config } });
  }

  /**
   * 获取元素配置
   */
  getElement(): Readonly<SNLayoutElementConfig> {
    return this.get().element;
  }

  /**
   * 更新元素配置
   */
  setElement(config: Partial<SNLayoutElementConfig>): void {
    this.set({ element: { ...this.get().element, ...config } });
  }
}
