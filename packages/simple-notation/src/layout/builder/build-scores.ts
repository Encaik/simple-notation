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
 *
 * 宽度计算：自顶向下（父节点 → 子节点）
 * 高度计算：自底向上（子节点 → 父节点）
 *
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

    // ========== 宽度计算（自顶向下）==========
    // 1. 先计算父节点（Score Block）的宽度
    calculateNodeWidth(scoreBlock);

    // 2. 计算元信息行的宽度（基于父节点宽度）
    if (scoreBlock.children) {
      for (const child of scoreBlock.children) {
        calculateNodeWidth(child);
      }
    }

    // 3. 构建 Section 节点（在构建过程中会递归计算宽度）
    buildSections(score.children || [], scoreBlock, layoutConfig, scoreConfig);

    // ========== 高度计算（自底向上）==========
    // 4. 所有子节点构建完成后，计算子节点的高度
    if (scoreBlock.children) {
      for (const child of scoreBlock.children) {
        calculateNodeHeight(child);
        // 如果子节点有子节点，也需要计算高度
        if (child.children) {
          for (const grandChild of child.children) {
            calculateNodeHeight(grandChild);
          }
        }
      }
    }

    // 5. 最后计算父节点（Score Block）的高度（基于子节点高度）
    calculateNodeHeight(scoreBlock);

    // ========== 位置计算（自顶向下）==========
    // 6. 计算所有节点的位置
    calculateNodePosition(scoreBlock);
    if (scoreBlock.children) {
      for (const child of scoreBlock.children) {
        calculateNodePosition(child);
        if (child.children) {
          for (const grandChild of child.children) {
            calculateNodePosition(grandChild);
          }
        }
      }
    }
  }
}
