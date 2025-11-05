import { SNLayoutRoot } from '@layout/node';
import { LayoutConfig } from '@manager/config';
import type { SNParserRoot } from '@data/node';

/**
 * Root 转换器
 *
 * 将数据层的 Root 节点转换为布局层的 Root 节点
 * 独立不耦合，任意放进去一个 Root 节点对象，都能产出布局层 Root 对象
 */
export class RootTransformer {
  constructor(private layoutConfig: LayoutConfig) {}

  /**
   * 转换 Root 节点
   *
   * @param root - 数据层 Root 节点
   * @param containerSize - 容器尺寸（可选，用于计算页面大小）
   * @returns 布局层 Root 节点
   */
  transform(
    root: SNParserRoot,
    containerSize?: { width: number; height: number },
  ): SNLayoutRoot {
    const layoutRoot = new SNLayoutRoot(`layout-${root.id}`);
    layoutRoot.data = root;

    // 获取全局配置
    const globalConfig = this.layoutConfig.getGlobal();
    const pageConfig = this.layoutConfig.getPage();

    // 计算实际画布尺寸
    // 如果 global.size 为 null 或 'auto'，需要从容器获取实际大小
    let canvasWidth: number | null = null;
    let canvasHeight: number | null = null;

    if (
      globalConfig.size.width !== null &&
      globalConfig.size.width !== 'auto' &&
      typeof globalConfig.size.width === 'number'
    ) {
      // 配置项传入了宽高，使用配置的宽高
      canvasWidth = globalConfig.size.width;
    } else if (containerSize) {
      // 没有传入宽高，查看容器宽高
      canvasWidth = containerSize.width;
    }

    if (
      globalConfig.size.height !== null &&
      globalConfig.size.height !== 'auto' &&
      typeof globalConfig.size.height === 'number'
    ) {
      canvasHeight = globalConfig.size.height;
    } else if (containerSize && globalConfig.size.autoHeight) {
      // 如果启用自动高度，高度由内容决定，初始为0
      canvasHeight = null;
    } else if (containerSize) {
      canvasHeight = containerSize.height;
    }

    // 如果启用分页，页面尺寸应该使用 page.size
    // 如果未启用分页，使用画布尺寸
    let effectiveWidth = canvasWidth;
    if (pageConfig.enable) {
      effectiveWidth = pageConfig.size.width;
    }

    // 获取全局padding和margin
    const globalPadding = globalConfig.spacing.padding || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
    const globalMargin = globalConfig.spacing.margin || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    // 设置根节点的布局属性
    // root的宽度：如果未设置则使用0（表示自适应），由渲染器处理为100%
    // 高度：初始为0，由布局计算填充
    layoutRoot.updateLayout({
      x: 0,
      y: 0,
      width: effectiveWidth || 0, // 0表示撑满容器
      height: canvasHeight || 0, // 由布局计算根据内容撑开
      padding: globalPadding,
      margin: globalMargin,
    });

    return layoutRoot;
  }
}
