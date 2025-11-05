import { SNLayoutBlock } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import type { SNParserNode } from '@data/node';
import type { SNLayoutBlock as SNLayoutBlockType } from '@layout/node';

/**
 * VoiceGroup 转换器
 *
 * 将数据层的 Section 下的所有 Voice 节点组织成一个 VoiceGroup Block
 * VoiceGroup 用于管理同一 Section 的多个 Voice，确保它们的小节对齐和同步换行
 *
 * 设计理念：
 * - 一个 Section 对应一个 VoiceGroup
 * - VoiceGroup 内部包含多个 Voice，每个 Voice 可能对应多个 Line（如果需要分行）
 * - 同一 VoiceGroup 内的所有 Voice 的小节必须对齐
 */
export class VoiceGroupTransformer {
  constructor(
    private layoutConfig: LayoutConfig,
    private scoreConfig: ScoreConfig,
  ) {}

  /**
   * 转换 Section 下的所有 Voice 为一个 VoiceGroup Block
   *
   * @param voices - Section 下的所有 Voice 节点
   * @param parentNode - 父布局节点（Section Block）
   * @returns 布局层 Block 节点（VoiceGroup）
   */
  transform(
    voices: SNParserNode[],
    parentNode: SNLayoutBlockType,
  ): SNLayoutBlock | null {
    if (!voices || voices.length === 0) {
      return null;
    }

    // 创建 VoiceGroup Block
    const voiceGroup = new SNLayoutBlock('voice-group');

    // 设置配置
    voiceGroup.updateLayout({
      x: 0, // 初始位置，由布局计算填充
      y: 0, // 初始位置，由布局计算填充
      width: 0, // 由布局计算填充（撑满父级）
      height: 0, // 由布局计算填充
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    // 建立父子关系
    parentNode.addChildren(voiceGroup);

    return voiceGroup;
  }
}
