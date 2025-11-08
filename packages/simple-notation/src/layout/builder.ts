import type { SNParserRoot } from '@data/node';
import type { SNLayoutRoot } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import { transformRoot } from './trans';
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
   * 构建布局树（自底向上构建）
   * @param dataTree - 数据树
   * @param containerSize - 容器尺寸（可选）
   * @returns 布局树根节点
   */
  private build(
    dataTree: SNParserRoot,
    containerSize?: { width: number; height: number },
  ): SNLayoutRoot {
    // 先创建 Root 节点（不设置子节点）
    const root = transformRoot(dataTree, this.layoutConfig, containerSize);

    // 获取页面配置
    const pageConfig = this.layoutConfig.getPage();

    // 根据页面配置决定是否分页，自底向上构建子节点
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

    // 所有子节点构建完成后，计算 Root 的布局信息
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
}
