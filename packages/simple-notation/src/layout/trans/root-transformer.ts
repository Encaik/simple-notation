import { SNLayoutRoot } from '@layout/node';
import { LayoutConfig } from '@manager/config';
import type { SNParserRoot } from '@data/node';

/**
 * 转换 Root 节点
 * @param root - 数据层 Root 节点
 * @param layoutConfig - 布局配置
 * @param containerSize - 容器尺寸
 */
export function transformRoot(
  root: SNParserRoot,
  layoutConfig: LayoutConfig,
  containerSize?: { width: number; height: number },
): SNLayoutRoot {
  const layoutRoot = new SNLayoutRoot(`layout-${root.id}`);
  layoutRoot.data = root;

  const globalConfig = layoutConfig.getGlobal();
  const pageConfig = layoutConfig.getPage();

  // 计算画布尺寸
  let canvasWidth: number | null = null;
  let canvasHeight: number | null = null;

  const globalWidth = globalConfig.size.width;
  if (
    globalWidth !== null &&
    globalWidth !== 'auto' &&
    typeof globalWidth === 'number'
  ) {
    canvasWidth = globalWidth;
  } else if (containerSize) {
    canvasWidth = containerSize.width;
  }

  const globalHeight = globalConfig.size.height;
  if (
    globalHeight !== null &&
    globalHeight !== 'auto' &&
    typeof globalHeight === 'number'
  ) {
    canvasHeight = globalHeight;
  } else if (containerSize && globalConfig.size.autoHeight) {
    canvasHeight = null;
  } else if (containerSize) {
    canvasHeight = containerSize.height;
  }

  // 启用分页时使用页面尺寸，否则使用画布尺寸
  const effectiveWidth = pageConfig.enable
    ? pageConfig.size.width
    : canvasWidth;

  const globalPadding = globalConfig.spacing.padding ?? {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  const globalMargin = globalConfig.spacing.margin ?? {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  layoutRoot.updateLayout({
    x: 0,
    y: 0,
    width: effectiveWidth ?? 0, // 0表示撑满容器
    height: canvasHeight ?? 0, // 由布局计算根据内容撑开
    padding: globalPadding,
    margin: globalMargin,
  });

  return layoutRoot;
}
