import { SNLayoutPage } from '@layout/node';
import { LayoutConfig } from '@manager/config';
import type { SNParserScore } from '@data/node';
import type { SNLayoutRoot } from '@layout/node';

/**
 * 转换 Score 节点为 Page 节点
 * @param score - 数据层 Score 节点
 * @param layoutConfig - 布局配置
 * @param parentNode - 父布局节点（Root）
 */
export function transformPage(
  score: SNParserScore,
  layoutConfig: LayoutConfig,
  parentNode: SNLayoutRoot,
): SNLayoutPage {
  const pageConfig = layoutConfig.getPage();
  const page = new SNLayoutPage(`layout-${score.id}`);
  page.data = score;

  const pageSize = pageConfig.size;
  const pageMargin = pageConfig.spacing.margin;
  const pagePadding = pageConfig.spacing.padding;

  page.updateLayout({
    x: 0,
    y: 0,
    width: pageSize.width - pageMargin.left - pageMargin.right,
    height: pageSize.height - pageMargin.top - pageMargin.bottom,
    padding: pagePadding,
    margin: pageMargin,
  });

  parentNode.addChildren(page);
  return page;
}
