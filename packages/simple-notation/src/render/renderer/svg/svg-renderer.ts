import { BaseRenderer } from '../base-renderer';
import type { SNLayoutNode } from '@layout/node';
import { SNLayoutNodeType } from '@layout/model';
import type { SNDebugConfig } from '@manager/model/debug-config';
import type { ScoreConfig } from '@manager/config';
import { RootNode, PageNode, BlockNode, LineNode, ElementNode } from './node';

/**
 * SVG 渲染器
 *
 * 使用 SVG 元素渲染布局树
 */
export class SvgRenderer extends BaseRenderer {
  /** 当前调试配置 */
  private debugConfig?: Readonly<SNDebugConfig>;
  /** 当前乐谱配置 */
  private scoreConfig?: ScoreConfig;
  /**
   * 创建 SVG 输出节点
   *
   * @returns SVG 元素
   */
  protected createOutputNode(): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // 默认设置为 100%，如果布局树中有具体尺寸，会在 render 方法中更新
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return svg;
  }

  /**
   * 渲染布局树
   *
   * @param layoutTree - 布局树根节点
   * @param debugConfig - 调试配置（可选）
   * @param scoreConfig - 乐谱配置（可选）
   */
  render(
    layoutTree: SNLayoutNode,
    debugConfig?: Readonly<SNDebugConfig>,
    scoreConfig?: ScoreConfig,
  ): void {
    // 存储配置，供子节点渲染函数使用
    this.debugConfig = debugConfig;
    this.scoreConfig = scoreConfig;
    if (!this.outputNode) {
      throw new Error('Renderer not mounted. Call mount() first.');
    }

    const svg = this.outputNode as SVGElement;
    const rootLayout = layoutTree.layout;

    // 处理画布尺寸
    // 如果 width/height 为 null 或 0，则撑满容器（100%）
    // 如果为具体数值，则设置为固定尺寸
    if (rootLayout) {
      if (
        rootLayout.width !== null &&
        rootLayout.width !== undefined &&
        typeof rootLayout.width === 'number' &&
        rootLayout.width > 0
      ) {
        svg.setAttribute('width', String(rootLayout.width));
      } else {
        // 没传入宽高配置时，撑满容器
        svg.setAttribute('width', '100%');
      }

      if (
        rootLayout.height !== null &&
        rootLayout.height !== undefined &&
        typeof rootLayout.height === 'number' &&
        rootLayout.height > 0
      ) {
        svg.setAttribute('height', String(rootLayout.height));
      } else {
        // 没传入宽高配置时，撑满容器
        svg.setAttribute('height', '100%');
      }
    } else {
      // 没有布局配置，默认撑满容器
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
    }

    // 计算SVG的实际宽度（如果设置为100%，需要获取容器的实际宽度）
    let svgWidth: number | undefined;
    const svgWidthAttr = svg.getAttribute('width');
    if (svgWidthAttr === '100%') {
      // 如果SVG宽度是100%，获取容器的实际宽度
      const container = svg.parentElement;
      if (container) {
        svgWidth =
          container.clientWidth || container.getBoundingClientRect().width;
      }
    } else if (
      svgWidthAttr &&
      typeof svgWidthAttr === 'string' &&
      !svgWidthAttr.includes('%')
    ) {
      svgWidth = parseFloat(svgWidthAttr);
    }

    // 如果root节点的宽度是0（表示自适应），根据SVG实际宽度设置
    if (
      rootLayout &&
      layoutTree.type === SNLayoutNodeType.ROOT &&
      svgWidth !== undefined
    ) {
      if (rootLayout.width === 0 || rootLayout.width === null) {
        // 调用root的calculateWidth方法，传入SVG宽度
        if (
          'calculateWidth' in layoutTree &&
          typeof layoutTree.calculateWidth === 'function'
        ) {
          layoutTree.calculateWidth(svgWidth);
        }
      }
    }

    // 清空之前的内容
    svg.innerHTML = '';

    // 根据节点类型选择对应的渲染函数
    this.renderNode(svg, layoutTree);
  }

  /**
   * 渲染单个节点
   *
   * @param parent - 父 SVG 元素
   * @param node - 布局节点
   */
  private renderNode(parent: SVGElement, node: SNLayoutNode): void {
    switch (node.type) {
      case SNLayoutNodeType.ROOT:
        RootNode.render(parent, node, this, this.debugConfig);
        break;
      case SNLayoutNodeType.PAGE:
        PageNode.render(parent, node, this, this.debugConfig);
        break;
      case SNLayoutNodeType.BLOCK:
        BlockNode.render(parent, node, this, this.debugConfig);
        break;
      case SNLayoutNodeType.LINE:
        LineNode.render(parent, node, this, this.debugConfig);
        break;
      case SNLayoutNodeType.ELEMENT:
        ElementNode.render(
          parent,
          node,
          this,
          this.debugConfig,
          this.scoreConfig,
        );
        break;
      default:
        console.warn(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * 递归渲染子节点（供子节点渲染函数调用）
   *
   * @param parent - 父 SVG 元素
   * @param node - 布局节点
   */
  renderChildren(parent: SVGElement, node: SNLayoutNode): void {
    if (node.children) {
      for (const child of node.children) {
        this.renderNode(parent, child);
      }
    }
  }
}
