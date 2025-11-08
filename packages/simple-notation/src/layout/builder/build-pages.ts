import type { SNParserScore } from '@data/node';
import type { SNLayoutRoot } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import { transformPage } from '../trans';
import { buildScores } from './build-scores';
import { finalizeNodeLayout } from './finalize-node-layout';

/**
 * 构建页面节点（分页模式）
 * @param scores - Score 节点数组
 * @param parentNode - 父节点
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
    // 使用 transformPage 转换 Score 为 Page
    const page = transformPage(score, layoutConfig, parentNode);

    // 构建 Score 节点（在 Page 内部）
    buildScores([score], page, layoutConfig, scoreConfig);

    // 子节点构建完成后，计算 Page 的布局信息
    finalizeNodeLayout(page);
  }
}
