import { BaseRenderer } from '../base-renderer';
import type { SNLayoutNode } from '@layout/node';

/**
 * Canvas 渲染器
 *
 * 使用 Canvas 2D API 渲染布局树
 */
export class CanvasRenderer extends BaseRenderer {
  /** Canvas 2D 上下文 */
  private ctx: CanvasRenderingContext2D | null = null;

  /**
   * 创建 Canvas 输出节点
   *
   * @returns Canvas 元素
   */
  protected createOutputNode(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    this.ctx = canvas.getContext('2d');
    return canvas;
  }

  /**
   * 渲染布局树
   *
   * @param layoutTree - 布局树根节点
   */
  render(layoutTree: SNLayoutNode): void {
    if (!this.outputNode || !this.ctx) {
      throw new Error('Renderer not mounted. Call mount() first.');
    }

    const canvas = this.outputNode as HTMLCanvasElement;
    const layout = layoutTree.layout;

    // 设置 Canvas 尺寸
    if (layout) {
      canvas.width = layout.width || 800;
      canvas.height = layout.height || 600;
    }

    // 清空画布
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // TODO: 实现 Canvas 渲染逻辑
    // 这里先绘制一个占位符
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillStyle = '#666';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'Canvas Renderer - Coming Soon',
      canvas.width / 2,
      canvas.height / 2,
    );
  }
}
