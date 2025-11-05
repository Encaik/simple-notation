import { SNLayoutPage } from '@layout/node';
import { LayoutConfig } from '@manager/config';
import type { SNParserScore } from '@data/node';
import type { SNLayoutRoot } from '@layout/node';

/**
 * Page 转换器
 *
 * 将数据层的 Score 节点转换为布局层的 Page 节点（分页模式）
 * 独立不耦合，任意放进去一个 Score 节点对象，都能产出布局层 Page 对象
 */
export class PageTransformer {
  constructor(private layoutConfig: LayoutConfig) {}

  /**
   * 转换 Score 节点为 Page 节点
   *
   * @param score - 数据层 Score 节点
   * @param parentNode - 父布局节点（Root）
   * @returns 布局层 Page 节点
   */
  transform(score: SNParserScore, parentNode: SNLayoutRoot): SNLayoutPage {
    const pageConfig = this.layoutConfig.getPage();

    // 创建页面节点并设置数据映射
    const page = new SNLayoutPage(`layout-${score.id}`);
    page.data = score;

    // 设置页面配置（padding、margin、尺寸等）
    const pageSize = pageConfig.size;
    const pageMargin = pageConfig.spacing.margin;
    const pagePadding = pageConfig.spacing.padding;

    page.updateLayout({
      x: 0, // 初始位置，由布局计算填充
      y: 0, // 初始位置，由布局计算填充
      width: pageSize.width - pageMargin.left - pageMargin.right,
      height: pageSize.height - pageMargin.top - pageMargin.bottom,
      padding: pagePadding,
      margin: pageMargin,
    });

    // 建立父子关系
    parentNode.addChildren(page);

    return page;
  }
}
