import type { SNLayoutNode } from '@layout/node';
import type { SvgRenderer } from '@render/renderer/svg';
import type { SNDebugConfig } from '@manager/model/debug-config';
import { SvgRenderNode } from './node';

/**
 * PAGE 节点渲染器
 */
export class PageNode extends SvgRenderNode {
  /**
   * 渲染 PAGE 节点
   *
   * @param parent - 父 SVG 元素
   * @param node - PAGE 布局节点
   * @param renderer - SVG 渲染器实例
   * @param debugConfig - 调试配置（可选）
   */
  static render(
    parent: SVGElement,
    node: SNLayoutNode,
    renderer: SvgRenderer,
    debugConfig?: Readonly<SNDebugConfig>,
  ): void {
    const layout = node.layout;
    if (!layout) return;

    // 创建页面容器组
    const g = SvgRenderNode.createGroup(node, 'page');

    // 设置位置
    const x = typeof layout.x === 'number' ? layout.x : 0;
    const y = typeof layout.y === 'number' ? layout.y : 0;
    SvgRenderNode.setTransform(g, x, y);

    // 绘制页面背景（PAGE层级：橙色）- 使用 debug 配置控制是否创建
    const width = typeof layout.width === 'number' ? layout.width : 0;
    const height = typeof layout.height === 'number' ? layout.height : 0;
    if (
      width > 0 &&
      height > 0 &&
      SvgRenderNode.isLayerBackgroundEnabled(debugConfig, 'page')
    ) {
      SvgRenderNode.drawBackgroundBox(
        g,
        width,
        height,
        {
          fill: '#ffa726', // 橙色半透明背景
          fillOpacity: '0.2',
          stroke: '#ffa726', // 橙色边框
          strokeWidth: '2',
        },
        false,
      );
    }

    // 渲染子节点
    renderer.renderChildren(g, node);

    parent.appendChild(g);
  }
}
