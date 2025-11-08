import type { SNParserNode } from '@data/node';
import type { SNLayoutBlock } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import { transformVoiceGroup, transformVoiceLine } from '../trans';
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
  const voiceGroup = transformVoiceGroup(
    voices,
    layoutConfig,
    scoreConfig,
    parentNode,
  );
  if (!voiceGroup) return;

  // 计算 VoiceGroup 的宽度（撑满父级）
  calculateNodeWidth(voiceGroup);

  // 获取可用宽度（减去 padding）
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
        lineIndex,
        shouldAddBottomMargin,
        voiceGroup,
      );
      if (!line) return;

      calculateNodeWidth(line);
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
      calculateNodePosition(line);
    });
  }

  // 子节点构建完成后，计算 VoiceGroup 的高度和位置
  calculateNodeHeight(voiceGroup);
  calculateNodePosition(voiceGroup);
}
