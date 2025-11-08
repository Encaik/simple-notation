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

    // 先计算 Block 的宽度（这样子节点 VoiceGroup 可以获取父节点宽度）
    calculateNodeWidth(sectionBlock);

    // 计算所有子节点（包括元信息行）的宽度和高度
    if (sectionBlock.children) {
      for (const child of sectionBlock.children) {
        calculateNodeWidth(child);
        calculateNodeHeight(child);
      }
    }

    // 构建 VoiceGroup（包含所有 Voice，并处理分行逻辑）
    buildVoiceGroups(
      (section.children || []) as SNParserNode[],
      sectionBlock,
      layoutConfig,
      scoreConfig,
    );

    // 子节点构建完成后，计算 Section Block 的高度和位置
    calculateNodeHeight(sectionBlock);
    calculateNodePosition(sectionBlock);

    // 计算所有子节点（包括元信息行和VoiceGroup）的位置
    if (sectionBlock.children) {
      for (const child of sectionBlock.children) {
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
