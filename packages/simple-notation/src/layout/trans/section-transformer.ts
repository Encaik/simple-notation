import { SNLayoutBlock } from '@layout/node';
import { ScoreConfig } from '@manager/config';
import type { SNParserNode } from '@data/node';
import type { SNLayoutBlock as SNLayoutBlockType } from '@layout/node';

/**
 * 转换 Section 节点
 *
 * @param section - 数据层 Section 节点
 * @param scoreConfig - 乐谱配置
 * @param parentNode - 父布局节点（Block）
 * @returns 布局层 Block 节点
 */
export function transformSection(
  section: SNParserNode,
  scoreConfig: ScoreConfig,
  parentNode: SNLayoutBlockType,
): SNLayoutBlock | null {
  // 类型检查：确保是 Section
  if (section.type !== 'section') {
    return null;
  }

  const sectionConfig = scoreConfig.getSection();

  // 创建 Block 节点（默认撑满父级宽度）
  const sectionBlock = new SNLayoutBlock(`layout-${section.id}`);
  sectionBlock.data = section;

  // 设置配置
  sectionBlock.updateLayout({
    x: 0, // 初始位置，由布局计算填充
    y: 0, // 初始位置，由布局计算填充
    width: 0, // 由布局计算填充（撑满父级）
    height: 0, // 由布局计算填充
    margin: {
      top: 0,
      right: 0,
      bottom: sectionConfig.spacing.sectionGap || 0,
      left: 0,
    },
  });

  // 建立父子关系
  parentNode.addChildren(sectionBlock);

  return sectionBlock;
}
