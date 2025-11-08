import { SNLayoutBlock } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import type { SNParserNode } from '@data/node';
import type { SNLayoutBlock as SNLayoutBlockType } from '@layout/node';

/**
 * 转换 Section 下的所有 Voice 为一个 VoiceGroup Block
 * 用于管理同一 Section 的多个 Voice，确保它们的小节对齐和同步换行
 * @param voices - Section 下的所有 Voice 节点
 * @param layoutConfig - 布局配置
 * @param scoreConfig - 乐谱配置
 * @param parentNode - 父布局节点（Section Block）
 */
export function transformVoiceGroup(
  voices: SNParserNode[],
  _layoutConfig: LayoutConfig,
  _scoreConfig: ScoreConfig,
  parentNode: SNLayoutBlockType,
): SNLayoutBlock | null {
  if (!voices?.length) {
    return null;
  }

  const voiceGroup = new SNLayoutBlock('voice-group');
  voiceGroup.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: 0, // 由布局计算填充
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  parentNode.addChildren(voiceGroup);
  return voiceGroup;
}
