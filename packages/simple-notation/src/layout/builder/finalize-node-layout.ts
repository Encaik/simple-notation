import type { SNLayoutNode } from '@layout/node';
import { calculateNodeHeight } from './calculate-height';
import { calculateNodePosition } from './calculate-position';

/**
 * 完成节点的布局计算（自底向上）
 *
 * 在子节点都构建完成后，调用此方法计算当前节点的布局信息。
 * 注意：宽度应该在构建子节点之前已经计算好了（自顶向下），
 * 这里只计算高度（自底向上）和位置（自顶向下）。
 *
 * @param node - 当前节点
 */
export function finalizeNodeLayout(node: SNLayoutNode): void {
  if (!node.layout) return;

  // 1. 计算高度（自底向上：基于子节点高度）
  calculateNodeHeight(node);

  // 2. 计算位置（自顶向下：基于父节点位置）
  calculateNodePosition(node);
}
