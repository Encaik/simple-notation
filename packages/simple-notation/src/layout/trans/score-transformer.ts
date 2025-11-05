import { SNLayoutBlock } from '@layout/node';
import { LayoutConfig } from '@manager/config';
import type { SNParserScore } from '@data/node';
import type { SNLayoutRoot, SNLayoutPage } from '@layout/node';

/**
 * Score 转换器
 *
 * 将数据层的 Score 节点转换为布局层的 Block 节点
 * 独立不耦合，任意放进去一个 Score 节点对象，都能产出布局层 Block 对象
 */
export class ScoreTransformer {
  constructor(private layoutConfig: LayoutConfig) {}

  /**
   * 转换 Score 节点
   *
   * @param score - 数据层 Score 节点
   * @param parentNode - 父布局节点（Root 或 Page）
   * @returns 布局层 Block 节点
   */
  transform(
    score: SNParserScore,
    parentNode: SNLayoutRoot | SNLayoutPage,
  ): SNLayoutBlock {
    const blockConfig = this.layoutConfig.getBlock();

    // 创建 Block 节点（默认撑满父级宽度）
    const scoreBlock = new SNLayoutBlock(`layout-${score.id}`);
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
}
