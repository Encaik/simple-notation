import type { SNParserNode } from '@data/node';
import { SNLayoutBlock, SNLayoutLine, SNLayoutElement } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import { buildMeasures } from './build-measures';
import { calculateNodeWidth } from './calculate-width';
import { calculateNodeHeight } from './calculate-height';
import { calculateNodePosition } from './calculate-position';
import { computeMeasureWidthByTicks } from './utils';
import { formatMusicInfo } from './metadata-utils';
import type { SNMusicProps } from '@data/model/props';

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

  // 跟踪每个 Voice 的当前配置状态，用于检测变更
  const voiceConfigs: Map<string, { keySignature?: any; timeSignature?: any }> =
    new Map();
  for (const { voice } of voiceMeasures) {
    // 初始化配置状态（从父节点获取）
    const parentKeySignature = voice.getKeySignature();
    const parentTimeSignature = voice.getTimeSignature();
    voiceConfigs.set(voice.id, {
      keySignature: parentKeySignature,
      timeSignature: parentTimeSignature,
    });
  }

  // 3) 按统一断点为每个 Voice 创建行并分配小节
  for (let lineIndex = 0; lineIndex < lineBreaks.length; lineIndex++) {
    const { start, end } = lineBreaks[lineIndex];
    const isLastLine = lineIndex === lineBreaks.length - 1;

    // 检测第一个小节是否有行内配置变更（仅对第一个 voice 检测，避免重复）
    const firstVoiceMeasures = voiceMeasures[0];
    if (firstVoiceMeasures && start < firstVoiceMeasures.measures.length) {
      const firstMeasure = firstVoiceMeasures.measures[start];
      if (firstMeasure) {
        const measureProps = firstMeasure.props as SNMusicProps | undefined;
        const hasInlineConfig =
          measureProps?.keySignature || measureProps?.timeSignature;

        if (hasInlineConfig) {
          // 检查是否有配置变更
          const currentConfig = voiceConfigs.get(firstVoiceMeasures.voice.id);
          const hasKeyChange =
            measureProps?.keySignature &&
            (!currentConfig?.keySignature ||
              currentConfig.keySignature.letter !==
                measureProps.keySignature.letter ||
              currentConfig.keySignature.symbol !==
                measureProps.keySignature.symbol);
          const hasTimeChange =
            measureProps?.timeSignature &&
            (!currentConfig?.timeSignature ||
              currentConfig.timeSignature.numerator !==
                measureProps.timeSignature.numerator ||
              currentConfig.timeSignature.denominator !==
                measureProps.timeSignature.denominator);

          if (hasKeyChange || hasTimeChange) {
            // 创建行内信息行
            const infoLine = createInlineInfoLine(
              `layout-inline-info-${firstVoiceMeasures.voice.id}-${lineIndex}`,
              measureProps,
            );
            voiceGroup.addChildren(infoLine);

            // 更新配置状态
            if (measureProps?.keySignature) {
              const config = voiceConfigs.get(firstVoiceMeasures.voice.id);
              if (config) {
                config.keySignature = measureProps.keySignature;
              }
            }
            if (measureProps?.timeSignature) {
              const config = voiceConfigs.get(firstVoiceMeasures.voice.id);
              if (config) {
                config.timeSignature = measureProps.timeSignature;
              }
            }
          }
        }
      }
    }

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

        // 更新配置状态（检查该行的小节是否有行内配置）
        const firstMeasureInLine = lineMeasures[0];
        if (firstMeasureInLine) {
          const measureProps = firstMeasureInLine.props as
            | SNMusicProps
            | undefined;
          if (measureProps?.keySignature) {
            const config = voiceConfigs.get(voice.id);
            if (config) {
              config.keySignature = measureProps.keySignature;
            }
          }
          if (measureProps?.timeSignature) {
            const config = voiceConfigs.get(voice.id);
            if (config) {
              config.timeSignature = measureProps.timeSignature;
            }
          }
        }
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

/**
 * 创建行内信息行（用于乐谱中间显示调号/拍号变更）
 * @param id - 行ID
 * @param props - 音乐属性（包含调号、拍号等）
 * @returns 信息行
 */
function createInlineInfoLine(id: string, props?: SNMusicProps): SNLayoutLine {
  const infoLine = new SNLayoutLine(id);
  infoLine.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: 25,
    padding: { top: 3, right: 0, bottom: 3, left: 0 },
    margin: { top: 0, right: 0, bottom: 5, left: 0 }, // 信息行与乐谱内容之间的间距
  });

  const musicInfo = formatMusicInfo(props);
  if (musicInfo) {
    const leftElement = new SNLayoutElement(`${id}-left-element`);
    leftElement.data = {
      type: 'metadata-music-info',
      text: musicInfo,
      align: 'left',
    } as any;
    const estimatedWidth = Math.max(100, musicInfo.length * 12);
    leftElement.updateLayout({
      x: 0,
      y: 0,
      width: estimatedWidth,
      height: 19,
      padding: { top: 0, right: 10, bottom: 0, left: 0 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    infoLine.addChildren(leftElement);
  }

  return infoLine;
}
