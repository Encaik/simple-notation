import type { SNParserScore } from '@data/node';
import { SNLayoutPage } from '@layout/node';
import type { SNLayoutRoot } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import { buildScores } from './build-scores';
import { finalizeNodeLayout } from './finalize-node-layout';

/**
 * 构建页面节点（分页模式）
 *
 * 宽度计算：自顶向下（Page 宽度在 transformPage 中已设置）
 * 高度计算：自底向上（子节点 → Page）
 *
 * @param scores - Score 节点数组
 * @param parentNode - 父节点（Root）
 * @param layoutConfig - 布局配置
 * @param scoreConfig - 乐谱配置
 */
export function buildPages(
  scores: SNParserScore[],
  parentNode: SNLayoutRoot,
  layoutConfig: LayoutConfig,
  scoreConfig: ScoreConfig,
): void {
  for (const score of scores) {
    // 转换 Score 为 Page
    // Page 的宽度在 transformPage 中已经设置（基于配置）
    const page = transformPage(score, layoutConfig, parentNode);

    // 构建 Score 节点（在 Page 内部）
    // buildScores 会递归计算所有子节点的宽度（自顶向下）和高度（自底向上）
    buildScores([score], page, layoutConfig, scoreConfig);

    // 所有子节点构建完成后，计算 Page 的高度和位置（自底向上）
    finalizeNodeLayout(page);
  }
}

/**
 * 转换 Score 节点为 Page 节点
 * @param score - 数据层 Score 节点
 * @param layoutConfig - 布局配置
 * @param parentNode - 父布局节点（Root）
 */
function transformPage(
  score: SNParserScore,
  layoutConfig: LayoutConfig,
  parentNode: SNLayoutRoot,
): SNLayoutPage {
  const pageConfig = layoutConfig.getPage();
  const page = new SNLayoutPage(`layout-${score.id}`);
  page.data = score;

  const pageSize = pageConfig.size;
  const pageMargin = pageConfig.spacing.margin;
  const pagePadding = pageConfig.spacing.padding;

  page.updateLayout({
    x: 0,
    y: 0,
    width: pageSize.width - pageMargin.left - pageMargin.right,
    height: pageSize.height - pageMargin.top - pageMargin.bottom,
    padding: pagePadding,
    margin: pageMargin,
  });

  parentNode.addChildren(page);
  return page;
}
