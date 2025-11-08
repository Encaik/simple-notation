import type { SNParserScore } from '@data/node';
import type { SNLayoutRoot, SNLayoutPage } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import { transformScore } from '../trans';
import { buildSections } from './build-sections';
import { calculateNodeWidth } from './calculate-width';
import { calculateNodeHeight } from './calculate-height';
import { calculateNodePosition } from './calculate-position';

/**
 * 构建 Score 节点
 * @param scores - Score 节点数组
 * @param parentNode - 父节点（Root 或 Page）
 * @param layoutConfig - 布局配置
 * @param scoreConfig - 乐谱配置
 */
export function buildScores(
  scores: SNParserScore[],
  parentNode: SNLayoutRoot | SNLayoutPage,
  layoutConfig: LayoutConfig,
  scoreConfig: ScoreConfig,
): void {
  for (const score of scores) {
    // 使用 transformScore 转换 Score 为 Block
    const scoreBlock = transformScore(score, layoutConfig, parentNode);

    // 先计算 Block 的宽度（这样子节点 Section Block 可以获取父节点宽度）
    calculateNodeWidth(scoreBlock);

    // 计算所有子节点（包括元信息行）的宽度和高度
    if (scoreBlock.children) {
      for (const child of scoreBlock.children) {
        calculateNodeWidth(child);
        calculateNodeHeight(child);
      }
    }

    // 构建 Section 节点
    buildSections(score.children || [], scoreBlock, layoutConfig, scoreConfig);

    // 子节点构建完成后，计算 Score Block 的高度和位置
    calculateNodeHeight(scoreBlock);
    calculateNodePosition(scoreBlock);

    // 计算所有子节点（包括元信息行和Section）的位置
    if (scoreBlock.children) {
      for (const child of scoreBlock.children) {
        // 先确保子节点的宽度和高度已计算
        calculateNodeWidth(child);
        calculateNodeHeight(child);
        // 计算子节点的位置
        calculateNodePosition(child);
        // 如果子节点是Line，需要递归计算其子节点（Element）的位置
        if (child.children) {
          for (const grandChild of child.children) {
            calculateNodeWidth(grandChild);
            calculateNodeHeight(grandChild);
            calculateNodePosition(grandChild);
          }
        }
      }
    }
  }
}
