import type { SNParserRoot } from '@data/node';
import { SNLayoutRoot } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import { buildPages, buildScores, finalizeNodeLayout } from './builder/index';

/**
 * 布局构建器
 * 负责将数据树（SNParserRoot）转换为布局树（SNLayoutRoot）
 * 架构：
 * - 数据层：Root → Score → Section → Voice → Measure → Element
 * - 布局层：ROOT → PAGE → BLOCK/LINE → ELEMENT
 */
export class SNLayoutBuilder {
  private layoutTree: SNLayoutRoot;
  private layoutConfig: LayoutConfig;
  private scoreConfig: ScoreConfig;

  /**
   * 创建布局构建器
   * @param dataTree - 数据树（解析后的乐谱数据）
   * @param layoutConfig - 布局配置（可选）
   * @param scoreConfig - 乐谱配置（可选）
   * @param containerSize - 容器尺寸（可选，用于计算页面大小）
   */
  constructor(
    dataTree: SNParserRoot,
    layoutConfig?: LayoutConfig,
    scoreConfig?: ScoreConfig,
    containerSize?: { width: number; height: number },
  ) {
    this.layoutConfig = layoutConfig ?? new LayoutConfig();
    this.scoreConfig = scoreConfig ?? new ScoreConfig();

    // 构建布局树
    this.layoutTree = this.build(dataTree, containerSize);
  }

  /**
   * 构建布局树
   *
   * 宽度计算：自顶向下（Root → Page/Block → Line → Element）
   * 高度计算：自底向上（Element → Line → Block → Page → Root）
   *
   * @param dataTree - 数据树
   * @param containerSize - 容器尺寸（可选）
   * @returns 布局树根节点
   */
  private build(
    dataTree: SNParserRoot,
    containerSize?: { width: number; height: number },
  ): SNLayoutRoot {
    // 先创建 Root 节点（宽度在 transformRoot 中已设置）
    const root = this.transformRoot(dataTree, containerSize);

    // 获取页面配置
    const pageConfig = this.layoutConfig.getPage();

    // 根据页面配置决定是否分页，构建子节点
    // 构建过程中会递归计算宽度（自顶向下）和高度（自底向上）
    if (pageConfig.enable) {
      buildPages(
        dataTree.children || [],
        root,
        this.layoutConfig,
        this.scoreConfig,
      );
    } else {
      buildScores(
        dataTree.children || [],
        root,
        this.layoutConfig,
        this.scoreConfig,
      );
    }

    // 所有子节点构建完成后，计算 Root 的高度和位置（自底向上）
    finalizeNodeLayout(root);

    return root;
  }

  /**
   * 获取布局树
   * @returns 布局树根节点
   */
  getLayoutTree(): SNLayoutRoot {
    return this.layoutTree;
  }

  /**
   * 转换 Root 节点
   * @param root - 数据层 Root 节点
   * @param containerSize - 容器尺寸
   */
  private transformRoot(
    root: SNParserRoot,
    containerSize?: { width: number; height: number },
  ): SNLayoutRoot {
    const layoutRoot = new SNLayoutRoot(`layout-${root.id}`);
    layoutRoot.data = root;

    const globalConfig = this.layoutConfig.getGlobal();
    const pageConfig = this.layoutConfig.getPage();

    // 计算画布尺寸
    let canvasWidth: number | null = null;
    let canvasHeight: number | null = null;

    const globalWidth = globalConfig.size.width;
    if (globalWidth !== null && typeof globalWidth === 'number') {
      canvasWidth = globalWidth;
    } else if (containerSize) {
      canvasWidth = containerSize.width;
    }

    const globalHeight = globalConfig.size.height;
    if (globalHeight !== null && typeof globalHeight === 'number') {
      canvasHeight = globalHeight;
    } else if (containerSize && globalConfig.size.autoHeight) {
      canvasHeight = null;
    } else if (containerSize) {
      canvasHeight = containerSize.height;
    }

    // 启用分页时使用页面尺寸，否则使用画布尺寸
    const effectiveWidth = pageConfig.enable
      ? pageConfig.size.width
      : canvasWidth;

    const globalPadding = globalConfig.spacing.padding ?? {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
    const globalMargin = globalConfig.spacing.margin ?? {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    layoutRoot.updateLayout({
      x: 0,
      y: 0,
      width: effectiveWidth ?? 0, // 0表示撑满容器
      height: canvasHeight ?? 0, // 由布局计算根据内容撑开
      padding: globalPadding,
      margin: globalMargin,
    });

    return layoutRoot;
  }
}
