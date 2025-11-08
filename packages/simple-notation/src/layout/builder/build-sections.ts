import type { SNParserNode } from '@data/node';
import type { SNLayoutBlock } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import { transformSection } from '../trans';
import { buildVoiceGroups } from './build-voice-groups';
import { calculateNodeWidth } from './calculate-width';
import { calculateNodeHeight } from './calculate-height';
import { calculateNodePosition } from './calculate-position';

/**
 * 构建 Section 节点
 *
 * 宽度计算：自顶向下（父节点 → 子节点）
 * 高度计算：自底向上（子节点 → 父节点）
 *
 * @param sections - Section 节点数组
 * @param parentNode - 父节点（Block）
 * @param layoutConfig - 布局配置
 * @param scoreConfig - 乐谱配置
 */
export function buildSections(
  sections: SNParserNode[],
  parentNode: SNLayoutBlock,
  layoutConfig: LayoutConfig,
  scoreConfig: ScoreConfig,
): void {
  for (const section of sections) {
    // 使用 transformSection 转换 Section 为 Block
    const sectionBlock = transformSection(section, scoreConfig, parentNode);

    if (!sectionBlock) continue;

    // ========== 宽度计算（自顶向下）==========
    // 1. 先计算父节点（Section Block）的宽度
    calculateNodeWidth(sectionBlock);

    // 2. 计算元信息行的宽度（基于父节点宽度）
    if (sectionBlock.children) {
      for (const child of sectionBlock.children) {
        calculateNodeWidth(child);
      }
    }

    // 3. 构建 VoiceGroup（在构建过程中会递归计算宽度）
    buildVoiceGroups(
      (section.children || []) as SNParserNode[],
      sectionBlock,
      layoutConfig,
      scoreConfig,
    );

    // ========== 高度计算（自底向上）==========
    // 4. 所有子节点构建完成后，计算子节点的高度
    if (sectionBlock.children) {
      for (const child of sectionBlock.children) {
        calculateNodeHeight(child);
        // 如果子节点有子节点，也需要计算高度
        if (child.children) {
          for (const grandChild of child.children) {
            calculateNodeHeight(grandChild);
          }
        }
      }
    }

    // 5. 最后计算父节点（Section Block）的高度（基于子节点高度）
    calculateNodeHeight(sectionBlock);

    // ========== 位置计算（自顶向下）==========
    // 6. 计算所有节点的位置
    calculateNodePosition(sectionBlock);
    if (sectionBlock.children) {
      for (const child of sectionBlock.children) {
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
