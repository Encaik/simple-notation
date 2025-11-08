import type { SNParserNode } from '@data/node';
import type { SNLayoutLine } from '@layout/node';
import { ScoreConfig } from '@manager/config';
import { transformMeasure } from '../trans';
import { buildMeasureElements } from './build-measure-elements';
import { calculateNodeHeight } from './calculate-height';
import { computeMeasureWidthByTicks } from './utils';

/**
 * 构建 Measure 节点
 *
 * 宽度计算：自顶向下（父节点 Line → Measure Element）
 * 高度计算：自底向上（Measure Element 内部元素 → Measure Element → Line）
 *
 * @param measures - Measure 节点数组
 * @param parentNode - 父节点（Line）
 * @param shouldStretch - 是否拉伸小节以撑满整行（非最后一行时）
 * @param availableWidth - 可用宽度（用于拉伸计算）
 * @param scoreConfig - 乐谱配置
 */
export function buildMeasures(
  measures: SNParserNode[],
  parentNode: SNLayoutLine,
  shouldStretch = false,
  availableWidth = 0,
  scoreConfig: ScoreConfig,
): void {
  // ========== 宽度计算（自顶向下）==========
  // 1. 先计算所有小节的基础宽度
  const baseWidths: number[] = [];
  for (const measure of measures) {
    const baseWidth = computeMeasureWidthByTicks(measure);
    baseWidths.push(baseWidth);
  }

  // 2. 计算总宽度
  const totalBaseWidth = baseWidths.reduce((sum, w) => sum + w, 0);

  // 3. 如果需要拉伸且总宽度小于可用宽度，计算拉伸比例
  let stretchRatio = 1;
  if (shouldStretch && totalBaseWidth > 0 && availableWidth > totalBaseWidth) {
    stretchRatio = availableWidth / totalBaseWidth;
  }

  // 4. 构建每个小节并设置宽度
  for (let i = 0; i < measures.length; i++) {
    const measure = measures[i];
    // 使用 transformMeasure 转换 Measure 为 Element
    const element = transformMeasure(measure, scoreConfig, parentNode);

    if (!element) continue;

    // 5. 设置 Measure Element 的宽度（基于父节点 Line 的可用宽度）
    const finalWidth = Math.round(baseWidths[i] * stretchRatio);
    if (element.layout) {
      element.layout.width = finalWidth;
    }

    // 6. 构建 Measure 内部的元素（Note/Rest/Lyric等）
    // 内部元素的宽度会基于 Measure Element 的宽度按比例分配
    buildMeasureElements(
      (measure.children || []) as SNParserNode[],
      element,
      scoreConfig,
    );
  }

  // ========== 高度计算（自底向上）==========
  // 7. 所有 Measure Element 构建完成后，计算父节点（Line）的高度
  // （buildMeasureElements 中已经计算了内部元素的高度，并更新了 Measure Element 的高度）
  calculateNodeHeight(parentNode);
}
