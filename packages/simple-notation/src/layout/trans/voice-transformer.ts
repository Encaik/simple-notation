import { SNLayoutLine } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import type { SNParserNode } from '@data/node';
import type { SNLayoutBlock } from '@layout/node';

/**
 * Voice 转换器
 *
 * 将数据层的 Voice 节点转换为布局层的 Line 节点
 * 独立不耦合，任意放进去一个 Voice 节点对象，都能产出布局层 Line 对象
 */
export class VoiceTransformer {
  constructor(
    private layoutConfig: LayoutConfig,
    private scoreConfig: ScoreConfig,
  ) {}

  /**
   * 转换 Voice 节点
   *
   * @param voice - 数据层 Voice 节点
   * @param parentNode - 父布局节点（Block）
   * @returns 布局层 Line 节点
   */
  transform(
    voice: SNParserNode,
    parentNode: SNLayoutBlock,
  ): SNLayoutLine | null {
    // 类型检查：确保是 Voice
    if (voice.type !== 'voice') {
      return null;
    }

    // 使用默认的 lineId 和 lineIndex，默认添加底部 margin（向后兼容）
    return this.transformLine(voice, `layout-${voice.id}`, 0, true, parentNode);
  }

  /**
   * 转换 Voice 节点为 Line（支持创建多个 Line）
   *
   * 当 Voice 需要分行时，可以通过此方法创建多个 Line
   *
   * @param voice - 数据层 Voice 节点
   * @param lineId - Line 的唯一标识
   * @param lineIndex - Line 的索引（用于区分同一 Voice 的多个 Line）
   * @param shouldAddBottomMargin - 是否在底部添加 margin（用于 VoiceGroup 的最后一个 Line）
   * @param parentNode - 父布局节点（Block 或 VoiceGroup）
   * @returns 布局层 Line 节点
   */
  transformLine(
    voice: SNParserNode,
    lineId: string,
    lineIndex: number,
    shouldAddBottomMargin: boolean,
    parentNode: SNLayoutBlock,
  ): SNLayoutLine | null {
    // 类型检查：确保是 Voice
    if (voice.type !== 'voice') {
      return null;
    }

    const lineConfig = this.layoutConfig.getLine();
    const voiceConfig = this.scoreConfig.getVoice();

    // 创建行节点
    const line = new SNLayoutLine(lineId);
    line.data = voice;

    // 设置配置
    const lineHeight = lineConfig.size.height || 50;
    const voiceGap = voiceConfig.spacing.voiceGap || 20;

    // 行间距：对 voice-group 中的每一条 line 都应用 voiceGap
    const marginBottom = voiceGap;

    line.updateLayout({
      x: 0, // 初始位置，由布局计算填充
      y: 0, // 初始位置，由布局计算填充
      width: 0, // 由布局计算填充（撑满父级）
      height: lineHeight, // 按配置设置
      padding: lineConfig.spacing.padding || {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      margin: { top: 0, right: 0, bottom: marginBottom, left: 0 },
    });

    // 建立父子关系
    parentNode.addChildren(line);

    return line;
  }
}
