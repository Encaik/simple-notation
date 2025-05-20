import { Logger, SvgUtils } from '@utils';

export class SNPointerLayer {
  /** SVG group 元素，作为内容的容器 */
  static el: SVGGElement;
  static pointerRect: SVGRectElement | null = null;

  constructor(svg: SVGElement) {
    Logger.debug('constructor 初始化播放光标层', 'SNPointerLayer');
    SNPointerLayer.el = SvgUtils.createG({ tag: 'pointer' });
    svg.appendChild(SNPointerLayer.el);
  }

  /**
   * 显示/移动播放光标
   * @param noteTag sn-tag属性值，如'note-1'
   * @param svgRoot SVG根节点
   */
  static showPointer(noteTag: string, svgRoot: SVGElement) {
    const noteEl = svgRoot.querySelector(
      `[sn-tag="${noteTag}"]`,
    ) as SVGGraphicsElement;
    if (!noteEl) return;
    const bbox = noteEl.getBBox();
    if (!SNPointerLayer.pointerRect) {
      const rect = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
      rect.setAttribute('x', String(bbox.x - 5));
      rect.setAttribute('y', String(bbox.y - 5));
      rect.setAttribute('width', String(bbox.width + 10));
      rect.setAttribute('height', String(bbox.height + 10));
      rect.setAttribute('fill', 'rgba(0,153,255,0.2)');
      rect.setAttribute('rx', '4');
      rect.setAttribute('ry', '4');
      SNPointerLayer.pointerRect = rect;
      SNPointerLayer.el.appendChild(rect);
    } else {
      SNPointerLayer.pointerRect.setAttribute('x', String(bbox.x - 5));
      SNPointerLayer.pointerRect.setAttribute('y', String(bbox.y - 5));
      SNPointerLayer.pointerRect.setAttribute('width', String(bbox.width + 10));
      SNPointerLayer.pointerRect.setAttribute(
        'height',
        String(bbox.height + 10),
      );
      SNPointerLayer.pointerRect.setAttribute('visibility', 'visible');
    }
  }

  /**
   * 清除播放光标
   */
  static clearPointer() {
    if (SNPointerLayer.pointerRect) {
      SNPointerLayer.pointerRect.setAttribute('visibility', 'hidden');
    }
  }
}
