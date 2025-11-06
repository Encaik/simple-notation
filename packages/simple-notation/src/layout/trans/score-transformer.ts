import { SNLayoutBlock } from '@layout/node';
import { LayoutConfig } from '@manager/config';
import type { SNParserScore } from '@data/node';
import type { SNLayoutRoot, SNLayoutPage } from '@layout/node';

/**
 * 转换 Score 节点
 *
 * @param score - 数据层 Score 节点
 * @param layoutConfig - 布局配置
 * @param parentNode - 父布局节点（Root 或 Page）
 * @returns 布局层 Block 节点
 */
export function transformScore(
  score: SNParserScore,
  layoutConfig: LayoutConfig,
  parentNode: SNLayoutRoot | SNLayoutPage,
): SNLayoutBlock {
  const blockConfig = layoutConfig.getBlock();

  // 创建 Block 节点（默认撑满父级宽度）
  const scoreBlock = new SNLayoutBlock(`layout-score-${score.id}`);
  scoreBlock.data = score;

  // 设置块配置
  scoreBlock.updateLayout({
    x: 0, // 初始位置，由布局计算填充
    y: 0, // 初始位置，由布局计算填充
    width: 0, // 由布局计算填充（撑满父级）
    height: 0, // 由布局计算填充
    padding: blockConfig.spacing.padding || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    margin: blockConfig.spacing.margin || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  });

  // 建立父子关系
  parentNode.addChildren(scoreBlock);

  return scoreBlock;
}
