import type { SNParserNode } from '@data/node';
import { getTimeUnitFromNode, measureDuration } from '@core/utils/time-unit';

/**
 * 基于 ticks 计算小节理想宽度（像素）
 * @param measure - 小节节点
 * @param pxPerBeat - 每拍像素数，默认40
 */
export function computeMeasureWidthByTicks(
  measure: SNParserNode,
  pxPerBeat = 40,
): number {
  const timeUnit = getTimeUnitFromNode(measure);
  const timeSignature = measure.getTimeSignature();
  const totalTicks: number = measureDuration(timeSignature, timeUnit);
  const pxPerTick = pxPerBeat / timeUnit.ticksPerBeat;
  return Math.max(20, Math.round(totalTicks * pxPerTick));
}
