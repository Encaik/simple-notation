import type { SNLayoutNode } from '@layout/node';
import type { SvgRenderer } from '@render/renderer/svg';
import type { SNDebugConfig } from '@manager/model/debug-config';
import { SvgRenderNode } from './node';

/**
 * LINE 节点渲染器
 */
export class LineNode extends SvgRenderNode {
  /**
   * 渲染 LINE 节点
   *
   * @param parent - 父 SVG 元素
   * @param node - LINE 布局节点
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

    // 创建行容器组
    const g = SvgRenderNode.createGroup(node, 'line');

    // 设置位置
    const x = typeof layout.x === 'number' ? layout.x : 0;
    const y = typeof layout.y === 'number' ? layout.y : 0;
    SvgRenderNode.setTransform(g, x, y);

    // 绘制行背景（用于调试）
    let width: number;
    if (layout.width && typeof layout.width === 'number' && layout.width > 0) {
      width = layout.width;
    } else if (node.parent?.layout) {
      // 从父节点计算可用宽度（默认撑满父级）
      const parentLayout = node.parent.layout;
      const parentWidth =
        typeof parentLayout.width === 'number' ? parentLayout.width : 0;
      const parentPadding = node.parent.layout.padding || {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
      const parentMargin = node.parent.layout.margin || {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
      width =
        parentWidth -
        parentPadding.left -
        parentPadding.right -
        parentMargin.left -
        parentMargin.right;
      width = Math.max(0, width);
    } else {
      // 最后的后备方案：使用默认宽度
      width = 100;
    }

    const height =
      layout.height && typeof layout.height === 'number' && layout.height > 0
        ? layout.height
        : 50; // 默认高度

    // 背景框（调试开关）
    if (SvgRenderNode.isLayerBackgroundEnabled(debugConfig, 'line')) {
      SvgRenderNode.drawBackgroundBox(
        g,
        width,
        height,
        {
          fill: '#66bb6a',
          fillOpacity: '0.12',
          stroke: '#66bb6a',
          strokeWidth: '1',
        },
        false,
      );
    }

    // 五线谱应按小节存在与否绘制，因此放在 measure 元素内按需渲染

    // 渲染子节点
    renderer.renderChildren(g, node);

    parent.appendChild(g);
  }
}
