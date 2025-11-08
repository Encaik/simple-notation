import { SNLayoutLine } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import type { SNParserNode } from '@data/node';
import type { SNLayoutBlock } from '@layout/node';

/**
 * 转换 Voice 节点
 * @param voice - 数据层 Voice 节点
 * @param layoutConfig - 布局配置
 * @param scoreConfig - 乐谱配置
 * @param parentNode - 父布局节点（Block）
 */
export function transformVoice(
  voice: SNParserNode,
  layoutConfig: LayoutConfig,
  scoreConfig: ScoreConfig,
  parentNode: SNLayoutBlock,
): SNLayoutLine | null {
  if (voice.type !== 'voice') {
    return null;
  }

  // 使用默认的 lineId 和 lineIndex，默认添加底部 margin（向后兼容）
  return transformVoiceLine(
    voice,
    layoutConfig,
    scoreConfig,
    `layout-${voice.id}`,
    0,
    true,
    parentNode,
  );
}

/**
 * 转换 Voice 节点为 Line（支持创建多个 Line）
 * 当 Voice 需要分行时，可以通过此方法创建多个 Line
 * @param voice - 数据层 Voice 节点
 * @param layoutConfig - 布局配置
 * @param scoreConfig - 乐谱配置
 * @param lineId - Line 的唯一标识
 * @param lineIndex - Line 的索引（用于区分同一 Voice 的多个 Line）
 * @param shouldAddBottomMargin - 是否在底部添加 margin（用于 VoiceGroup 的最后一个 Line）
 * @param parentNode - 父布局节点（Block 或 VoiceGroup）
 */
export function transformVoiceLine(
  voice: SNParserNode,
  layoutConfig: LayoutConfig,
  scoreConfig: ScoreConfig,
  lineId: string,
  _lineIndex: number,
  _shouldAddBottomMargin: boolean,
  parentNode: SNLayoutBlock,
): SNLayoutLine | null {
  if (voice.type !== 'voice') {
    return null;
  }

  const lineConfig = layoutConfig.getLine();
  const voiceConfig = scoreConfig.getVoice();
  const line = new SNLayoutLine(lineId);
  line.data = voice;

  const lineHeight = lineConfig.size.height ?? 50;
  const voiceGap = voiceConfig.spacing.voiceGap ?? 20;

  line.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: lineHeight,
    padding: lineConfig.spacing.padding ?? {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    margin: { top: 0, right: 0, bottom: voiceGap, left: 0 },
  });

  parentNode.addChildren(line);
  return line;
}
