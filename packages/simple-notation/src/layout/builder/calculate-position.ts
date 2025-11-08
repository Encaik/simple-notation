import { SNLayoutLine, SNLayoutElement, type SNLayoutNode } from '@layout/node';

/**
 * 计算节点的位置（x, y坐标）
 * 父子之间的xy都是相对的，即子节点的xy是基于父节点xy计算的
 * @param node - 当前节点
 */
export function calculateNodePosition(node: SNLayoutNode): void {
  if (!node.layout) return;

  // 根节点位置固定为(0, 0)
  if (!node.parent) {
    node.layout.x = 0;
    node.layout.y = 0;
    return;
  }

  const parentLayout = node.parent.layout;
  if (!parentLayout) return;

  const parentPadding = node.getParentPadding();

  // 计算X坐标
  // 对于垂直排列的节点（Block, Line），X = 父节点的padding.left
  // 对于水平排列的节点（Element），X = 父节点的padding.left + 前面兄弟节点的累积宽度
  if (node instanceof SNLayoutElement) {
    // 检查是否是右对齐的元信息元素（如作词作曲）
    const nodeData = node.data as any;
    const isRightAlignedMetadata =
      nodeData?.type === 'metadata-contributors' && nodeData?.align === 'right';

    if (isRightAlignedMetadata && node.parent instanceof SNLayoutLine) {
      // 右对齐的元信息元素：计算位置使其位于行的右侧
      const parentWidth =
        typeof parentLayout.width === 'number' ? parentLayout.width : 0;
      const elementWidth =
        typeof node.layout.width === 'number' ? node.layout.width : 0;
      const elementPadding = node.layout.padding ?? {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };

      // 如果父节点宽度仍然为0，使用父节点的父节点宽度
      let actualParentWidth = parentWidth;
      if (actualParentWidth === 0 && node.parent.parent?.layout) {
        const grandParentWidth =
          typeof node.parent.parent.layout.width === 'number'
            ? node.parent.parent.layout.width
            : 0;
        if (grandParentWidth > 0) {
          actualParentWidth = grandParentWidth;
        }
      }

      // x = 父节点padding.left + (父节点可用宽度 - 元素实际占用宽度)
      const parentAvailableWidth =
        actualParentWidth - parentPadding.left - parentPadding.right;
      const elementTotalWidth =
        elementWidth + elementPadding.left + elementPadding.right;
      node.layout.x =
        parentPadding.left + parentAvailableWidth - elementTotalWidth;
    } else {
      // Element节点：水平排列，需要累加前面兄弟节点的宽度
      let x = parentPadding.left;

      const siblingIndex = node.parent.children?.indexOf(node) ?? -1;
      if (siblingIndex > 0 && node.parent.children) {
        for (let i = 0; i < siblingIndex; i++) {
          const sibling = node.parent.children[i];
          if (sibling.layout) {
            const siblingWidth =
              typeof sibling.layout.width === 'number'
                ? sibling.layout.width
                : 0;
            const siblingMargin = sibling.layout.margin ?? {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            };
            // 累加兄弟节点的宽度和右边margin
            x += siblingWidth + siblingMargin.right;
          }
        }
      }
      node.layout.x = x;
    }
  } else {
    // Block和Line节点：垂直排列，X = 父节点的padding.left
    node.layout.x = parentPadding.left;
  }

  // 计算Y坐标
  // 对于垂直排列的节点（Block, Line），Y = 父节点的padding.top + 前面兄弟节点的累积高度
  // 对于水平排列的节点（Element），Y = 父节点的padding.top
  if (node instanceof SNLayoutElement) {
    // Element节点：水平排列，Y = 父节点的padding.top
    node.layout.y = parentPadding.top;
  } else {
    // Block和Line节点：垂直排列，需要累加前面兄弟节点的高度
    let y = parentPadding.top;

    const siblingIndex = node.parent.children?.indexOf(node) ?? -1;
    if (siblingIndex > 0 && node.parent.children) {
      for (let i = 0; i < siblingIndex; i++) {
        const sibling = node.parent.children[i];
        if (sibling.layout) {
          const siblingHeight =
            typeof sibling.layout.height === 'number'
              ? sibling.layout.height
              : 0;
          const siblingMargin = sibling.layout.margin ?? {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          };
          // 累加兄弟节点的高度和底部margin
          y += siblingHeight + siblingMargin.bottom;
        }
      }
    }
    node.layout.y = y;
  }
}
