import { SNLayoutBlock, SNLayoutLine, type SNLayoutNode } from '@layout/node';
import { SNLayoutNodeType } from '@layout/model';

/**
 * 计算节点的宽度
 * @param node - 当前节点
 */
export function calculateNodeWidth(node: SNLayoutNode): void {
  if (!node.layout) return;

  switch (node.type) {
    case SNLayoutNodeType.ROOT: {
      // Root节点的宽度在渲染时由渲染器根据SVG实际宽度设置
      // 这里先设置为0，表示自适应
      if (
        node.layout.width === null ||
        node.layout.width === 'auto' ||
        typeof node.layout.width !== 'number'
      ) {
        node.layout.width = 0;
      }
      break;
    }

    case SNLayoutNodeType.PAGE: {
      // Page宽度已在构建时设置，确保是数值类型
      if (
        node.layout.width === null ||
        node.layout.width === 'auto' ||
        typeof node.layout.width !== 'number'
      ) {
        node.layout.width = 0;
      }
      break;
    }

    case SNLayoutNodeType.BLOCK:
    case SNLayoutNodeType.LINE: {
      // Block和Line：撑满父级宽度
      if (node instanceof SNLayoutBlock || node instanceof SNLayoutLine) {
        node.calculateWidth();
      }
      break;
    }

    case SNLayoutNodeType.ELEMENT: {
      // Element：如果已有固定宽度，尊重之；否则根据子节点计算
      const hasFixedWidth =
        node.layout.width !== null &&
        typeof node.layout.width === 'number' &&
        node.layout.width > 0;

      if (!hasFixedWidth) {
        // 检查是否是元信息标题容器元素（需要撑满父级宽度）
        const nodeData = node.data as any;
        const isMetadataTitleContainer =
          nodeData?.type === 'metadata-title-container' ||
          nodeData?.type === 'metadata-section-title-container';

        if (isMetadataTitleContainer && node.parent) {
          // 元信息标题元素：撑满父级可用宽度
          const parentAvailableWidth = node.getParentAvailableWidth();
          if (parentAvailableWidth !== null && parentAvailableWidth > 0) {
            const padding = node.layout.padding ?? {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            };
            node.layout.width =
              parentAvailableWidth - padding.left - padding.right;
          } else {
            node.layout.width = 0;
          }
        } else if (node.children?.length) {
          const childrenMaxWidth = node.calculateChildrenMaxWidth();
          const padding = node.layout.padding ?? {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          };
          node.layout.width =
            childrenMaxWidth > 0
              ? childrenMaxWidth + padding.left + padding.right
              : 20;
        } else {
          // 叶子元素：使用已有宽度或默认值
          if (
            !node.layout.width ||
            typeof node.layout.width !== 'number' ||
            node.layout.width === 0
          ) {
            node.layout.width = 20;
          }
        }
      }
      break;
    }

    default:
      break;
  }
}
