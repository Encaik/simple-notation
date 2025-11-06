import type { SNLayoutNode } from '@layout/node';
import type { SNDebugConfig } from '@manager/model/debug-config';

/**
 * 背景框样式配置
 */
export interface BackgroundBoxStyle {
  /** 填充颜色 */
  fill: string;
  /** 填充透明度 */
  fillOpacity: string;
  /** 描边颜色 */
  stroke: string;
  /** 描边宽度 */
  strokeWidth: string;
}

/**
 * SVG 节点渲染器基类
 *
 * 提供所有节点渲染器的共同逻辑，包括：
 * - 创建 SVG group 元素
 * - 设置基本属性（id、layouttype、datatype）
 * - 设置 transform
 * - 检查 debug 配置
 * - 绘制调试背景框
 */
export abstract class SvgRenderNode {
  /**
   * 检查某层级是否启用背景框
   *
   * @param debugConfig - 调试配置
   * @param layer - 层级名称
   * @returns 是否启用
   */
  protected static isLayerBackgroundEnabled(
    debugConfig: Readonly<SNDebugConfig> | undefined,
    layer: keyof NonNullable<SNDebugConfig['layers']>,
  ): boolean {
    if (!debugConfig) return false;
    // 全局开关优先：如果全局开关为 false，所有层级都关闭
    const global = !!debugConfig.enableBackgroundBoxes;
    if (!global) return false;
    // 全局开关为 true 时，检查层级配置
    const layers = debugConfig.layers || {};
    const value = layers[layer];
    // 如果层级明确设置则使用层级配置，否则继承全局配置（true）
    return typeof value === 'boolean' ? value : global;
  }

  /**
   * 创建 SVG group 元素并设置基本属性
   *
   * @param node - 布局节点
   * @param layoutType - 布局类型（如 'root'、'page' 等）
   * @returns SVG group 元素
   */
  protected static createGroup(
    node: SNLayoutNode,
    layoutType: string,
  ): SVGElement {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', node.id);
    g.setAttribute('layouttype', layoutType);
    // 设置数据层类型（如果有对应的数据节点）
    if (node.data?.type) {
      g.setAttribute('datatype', node.data.type);
    }
    return g;
  }

  /**
   * 设置 SVG group 的 transform 属性
   *
   * @param g - SVG group 元素
   * @param x - X 坐标
   * @param y - Y 坐标
   */
  protected static setTransform(g: SVGElement, x: number, y: number): void {
    g.setAttribute('transform', `translate(${x}, ${y})`);
  }

  /**
   * 绘制调试背景框
   *
   * @param g - SVG group 元素
   * @param width - 宽度
   * @param height - 高度
   * @param style - 背景框样式
   * @param insertBefore - 是否插入到最前面（默认 false，追加到最后）
   */
  protected static drawBackgroundBox(
    g: SVGElement,
    width: number,
    height: number,
    style: BackgroundBoxStyle,
    insertBefore = false,
  ): void {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('fill', style.fill);
    rect.setAttribute('fill-opacity', style.fillOpacity);
    rect.setAttribute('stroke', style.stroke);
    rect.setAttribute('stroke-width', style.strokeWidth);

    if (insertBefore) {
      // 将背景框插入到最前面，这样子节点会显示在上面
      g.insertBefore(rect, g.firstChild);
    } else {
      g.appendChild(rect);
    }
  }
}
