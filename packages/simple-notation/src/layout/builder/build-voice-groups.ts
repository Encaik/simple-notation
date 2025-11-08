import type { SNParserNode } from '@data/node';
import { SNLayoutBlock, SNLayoutLine } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import { buildMeasures } from './build-measures';
import { calculateNodeWidth } from './calculate-width';
import { calculateNodeHeight } from './calculate-height';
import { calculateNodePosition } from './calculate-position';
import { computeMeasureWidthByTicks } from './utils';

/**
 * 构建 VoiceGroup 节点
 * 将同一 Section 的所有 Voice 组织成一个 VoiceGroup，实现小节对齐和同步换行
 * @param voices - Voice 节点数组
 * @param parentNode - 父节点（Section Block）
 * @param layoutConfig - 布局配置
 * @param scoreConfig - 乐谱配置
 */
export function buildVoiceGroups(
  voices: SNParserNode[],
  parentNode: SNLayoutBlock,
  layoutConfig: LayoutConfig,
  scoreConfig: ScoreConfig,
): void {
  if (!voices?.length) return;

  // 创建 VoiceGroup
  const voiceGroup = transformVoiceGroup(voices, parentNode);
  if (!voiceGroup) return;

  // ========== 宽度计算（自顶向下）==========
  // 1. 先计算 VoiceGroup 的宽度（撑满父级）
  calculateNodeWidth(voiceGroup);

  // 2. 获取可用宽度（减去 padding），用于后续的小节宽度计算
  const availableWidth = voiceGroup.getAvailableWidth();

  // 收集所有 Voice 的小节信息
  const voiceMeasures: Array<{
    voice: SNParserNode;
    measures: SNParserNode[];
    measureCount: number;
  }> = [];

  for (const voice of voices) {
    if (voice.type !== 'voice') continue;
    const measures = (voice.children || []) as SNParserNode[];
    voiceMeasures.push({
      voice,
      measures,
      measureCount: measures.length,
    });
  }

  if (voiceMeasures.length === 0) return;

  // 1) 计算每个小节在每个 Voice 中的实际宽度，并取同一小节索引的最大值，确保跨声部对齐
  const maxMeasureCount = Math.max(
    ...voiceMeasures.map((vm) => vm.measureCount),
  );
  const maxWidthsByIndex: number[] = [];
  for (let i = 0; i < maxMeasureCount; i++) {
    let maxWidth = 0;
    for (const { measures } of voiceMeasures) {
      const m = measures[i];
      if (!m) continue;
      const w = computeMeasureWidthByTicks(m);
      if (w > maxWidth) maxWidth = w;
    }
    // 后备：至少给一个基础宽度，避免0
    if (maxWidth <= 0) maxWidth = 40;
    maxWidthsByIndex.push(maxWidth);
  }

  // 2) 基于最大宽度，使用贪心切分行，得到统一的换行断点
  const lineBreaks: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  while (cursor < maxMeasureCount) {
    let lineWidth = 0;
    const start = cursor;
    while (cursor < maxMeasureCount) {
      const nextWidth = maxWidthsByIndex[cursor];
      if (lineWidth + nextWidth <= availableWidth) {
        lineWidth += nextWidth;
        cursor++;
      } else {
        break;
      }
    }
    if (cursor === start) {
      // 单个小节都放不下，强制至少放一个，防止死循环
      cursor++;
    }
    lineBreaks.push({ start, end: cursor });
  }

  // 3) 按统一断点为每个 Voice 创建行并分配小节
  for (let lineIndex = 0; lineIndex < lineBreaks.length; lineIndex++) {
    const { start, end } = lineBreaks[lineIndex];
    const isLastLine = lineIndex === lineBreaks.length - 1;

    voiceMeasures.forEach(({ voice, measures }, voiceIndex) => {
      const lineMeasures = measures.slice(start, end);

      if (lineMeasures.length === 0 && !isLastLine) {
        return;
      }

      const isLastVoice = voiceIndex === voiceMeasures.length - 1;
      // 每个行组（同一 lineIndex）之后都加行间距，仅在该行组的最后一个 voice 行上加
      const shouldAddBottomMargin = isLastVoice;

      const lineId = `layout-${voice.id}-line-${lineIndex}`;
      const line = transformVoiceLine(
        voice,
        layoutConfig,
        scoreConfig,
        lineId,
        shouldAddBottomMargin,
        voiceGroup,
      );
      if (!line) return;

      // 3. 计算 Line 的宽度（基于父节点 VoiceGroup 的宽度）
      calculateNodeWidth(line);

      // 4. 构建 Measure 节点（在构建过程中会计算 Measure 的宽度）
      if (lineMeasures.length > 0) {
        // 对于非最后一行，需要拉伸小节以撑满整行
        buildMeasures(
          lineMeasures,
          line,
          !isLastLine,
          availableWidth,
          scoreConfig,
        );
      }
    });
  }

  // ========== 高度计算（自底向上）==========
  // 5. 所有子节点（Line）构建完成后，计算子节点的高度
  if (voiceGroup.children) {
    for (const child of voiceGroup.children) {
      calculateNodeHeight(child);
      // Line 的子节点（Element）高度在 buildMeasures 中已计算
    }
  }

  // 6. 最后计算父节点（VoiceGroup）的高度（基于子节点高度）
  calculateNodeHeight(voiceGroup);

  // ========== 位置计算（自顶向下）==========
  // 7. 计算所有节点的位置（递归计算所有子节点）
  calculateNodePosition(voiceGroup);
  if (voiceGroup.children) {
    for (const child of voiceGroup.children) {
      calculateNodePosition(child);
      // 递归计算 Line 的子节点（Measure Element）的位置
      if (child.children) {
        for (const grandChild of child.children) {
          calculateNodePosition(grandChild);
        }
      }
    }
  }
}

/**
 * 转换 Section 下的所有 Voice 为一个 VoiceGroup Block
 * 用于管理同一 Section 的多个 Voice，确保它们的小节对齐和同步换行
 * @param voices - Section 下的所有 Voice 节点
 * @param parentNode - 父布局节点（Section Block）
 */
function transformVoiceGroup(
  voices: SNParserNode[],
  parentNode: SNLayoutBlock,
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

/**
 * 转换 Voice 节点为 Line（支持创建多个 Line）
 * 当 Voice 需要分行时，可以通过此方法创建多个 Line
 * @param voice - 数据层 Voice 节点
 * @param layoutConfig - 布局配置
 * @param scoreConfig - 乐谱配置
 * @param lineId - Line 的唯一标识
 * @param shouldAddBottomMargin - 是否在底部添加 margin（用于 VoiceGroup 的最后一个 Line）
 * @param parentNode - 父布局节点（Block 或 VoiceGroup）
 */
function transformVoiceLine(
  voice: SNParserNode,
  layoutConfig: LayoutConfig,
  scoreConfig: ScoreConfig,
  lineId: string,
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
