import {
  SNLayoutRoot,
  SNLayoutBlock,
  SNLayoutLine,
  type SNLayoutNode,
} from '@layout/node';
import { SNLayoutNodeType } from '@layout/model';

/**
 * 计算节点的高度
 * @param node - 当前节点
 */
export function calculateNodeHeight(node: SNLayoutNode): void {
  if (!node.layout) return;

  switch (node.type) {
    case SNLayoutNodeType.ROOT:
    case SNLayoutNodeType.BLOCK: {
      // Root和Block：根据子节点内容撑开高度
      if (node instanceof SNLayoutRoot || node instanceof SNLayoutBlock) {
        node.calculateHeight();
      }
      break;
    }

    case SNLayoutNodeType.PAGE: {
      // Page：根据子节点内容撑开高度
      const childrenHeight = node.calculateChildrenHeight();
      const padding = node.layout.padding ?? {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
      // childrenHeight 返回的是 maxBottom，已经包含了 padding.top 的空间
      // 所以只需要加上 padding.bottom 即可
      node.layout.height = childrenHeight + padding.bottom;
      break;
    }

    case SNLayoutNodeType.LINE: {
      // Line节点高度需要根据实际内容动态调整
      if (node instanceof SNLayoutLine) {
        const defaultHeight =
          typeof node.layout.height === 'number' && node.layout.height > 0
            ? node.layout.height
            : 50;

        let requiredHeight = defaultHeight;

        if (node.children?.length) {
          let maxChildHeight = 0;
          let hasMetadata = false;

          for (const child of node.children) {
            if (!child.layout) continue;

            const childData = child.data as any;
            const childType = childData?.type as string | undefined;

            // 检查是否是调号等元信息元素
            if (
              childType === 'metadata-music-info' ||
              childType === 'metadata-contributors'
            ) {
              hasMetadata = true;
              const childHeight =
                typeof child.layout.height === 'number'
                  ? child.layout.height
                  : 0;
              maxChildHeight = Math.max(maxChildHeight, childHeight);
            }

            // 检查是否是 measure 元素
            if (childType === 'measure') {
              const childHeight =
                typeof child.layout.height === 'number'
                  ? child.layout.height
                  : 0;
              maxChildHeight = Math.max(maxChildHeight, childHeight);
            }
          }

          if (maxChildHeight > 0) {
            requiredHeight = Math.max(requiredHeight, maxChildHeight);
          }

          // 如果有调号等元信息，确保行高足够
          if (hasMetadata && maxChildHeight === 0) {
            const metadataHeightIncrement = 5;
            requiredHeight = Math.max(
              requiredHeight,
              defaultHeight + metadataHeightIncrement,
            );
          }
        }

        node.layout.height = requiredHeight;
      }
      break;
    }

    case SNLayoutNodeType.ELEMENT: {
      // Element：根据子节点计算高度，如果没有子节点则使用默认值
      const nodeData = node.data as any;
      const isMeasure = nodeData?.type === 'measure';

      if (node.children?.length) {
        const childrenHeight = node.calculateChildrenHeight();
        const padding = node.layout.padding ?? {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };
        const calculatedHeight = childrenHeight + padding.bottom;

        // 如果是 measure element，需要确保有足够的冗余高度来容纳上下加线和符干
        if (isMeasure) {
          const staffTop = 6; // 五线谱顶部偏移
          const staffHeight = 30; // 五线谱高度
          const stemLength = 20; // 符干长度
          const ledgerLineSpace = 15; // 上下加线的冗余空间（约2个线间距）
          const minMeasureHeight =
            staffTop + staffHeight + stemLength + ledgerLineSpace; // 71px

          node.layout.height = Math.max(calculatedHeight, minMeasureHeight);
        } else {
          node.layout.height = calculatedHeight;
        }
      } else {
        // 叶子元素：使用已有高度或默认值
        if (
          !node.layout.height ||
          typeof node.layout.height !== 'number' ||
          node.layout.height === 0
        ) {
          // measure 的默认高度应该包含五线谱和冗余空间
          if (isMeasure) {
            const staffTop = 6;
            const staffHeight = 30;
            const stemLength = 20;
            const ledgerLineSpace = 15;
            node.layout.height =
              staffTop + staffHeight + stemLength + ledgerLineSpace; // 71px
          } else {
            node.layout.height = 20;
          }
        }
      }
      break;
    }

    default:
      break;
  }
}
