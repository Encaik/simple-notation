import { Logger, SvgUtils } from '@utils';
import { SNNote } from '@components';
import { SNEvent } from '@core';
import { SNNoteEventDetail } from '@types';

export class SNPointerLayer {
  /** SVG root元素 */
  static svg: SVGElement;
  /** SVG group 元素，作为内容的容器 */
  static el: SVGGElement;
  /** 播放指针矩形 */
  static pointerRect: SVGRectElement | null = null;
  /** 存储音符和矩形的对应关系 */
  static noteRectMap: Map<number, SVGRectElement> = new Map();
  /** 存储音符实例的对应关系 */
  static noteInstanceMap: Map<number, SNNote> = new Map();
  /** 事件系统实例 */
  static event: SNEvent;

  /** 播放指针颜色 */
  private static readonly POINTER_COLOR = 'rgba(0, 191, 255, 0.3)';
  /** 交互指针颜色 */
  private static readonly HOVER_COLOR = 'rgba(255, 165, 0, 0.2)';
  /** 指针圆角大小 */
  private static readonly ROUND_RADIUS = 4;

  /**
   * 初始化指针层
   * @param svg SVG容器元素
   */
  constructor(svg: SVGElement) {
    Logger.debug('constructor 初始化播放光标层', 'SNPointerLayer');
    SNPointerLayer.svg = svg;
    SNPointerLayer.el = SvgUtils.createG({ tag: 'pointer' });
    svg.appendChild(SNPointerLayer.el);
    SNPointerLayer.event = SNEvent.getInstance();
    SNPointerLayer.initPointer();
    SNPointerLayer.bindEvents();
  }

  /**
   * 初始化播放光标
   */
  private static initPointer() {
    Logger.debug('initPointer 初始化播放光标', 'SNPointerLayer');
    SNPointerLayer.pointerRect = SvgUtils.createRect({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      fill: SNPointerLayer.POINTER_COLOR,
      rx: SNPointerLayer.ROUND_RADIUS,
      ry: SNPointerLayer.ROUND_RADIUS,
    });
    SNPointerLayer.pointerRect.setAttribute('visibility', 'hidden');
    SNPointerLayer.el.appendChild(SNPointerLayer.pointerRect);
  }

  /**
   * 创建音符的交互矩形
   */
  static createNoteRect(note: SNNote) {
    const bbox = note.el.getBBox();
    const rect = SvgUtils.createRect({
      x: bbox.x - 5,
      y: bbox.y - 5,
      width: bbox.width + 10,
      height: bbox.height + 10,
      fill: SNPointerLayer.HOVER_COLOR,
      rx: SNPointerLayer.ROUND_RADIUS,
      ry: SNPointerLayer.ROUND_RADIUS,
    });
    rect.setAttribute('note-index', note.index.toString());
    rect.setAttribute(
      'note-data',
      JSON.stringify({
        index: note.index,
        note: note.note,
        noteData: note.noteData,
        weight: note.weight,
        underlineCount: note.underlineCount,
        upDownCount: note.upDownCount,
        octaveCount: note.octaveCount,
        isTieStart: note.isTieStart,
        isTieEnd: note.isTieEnd,
        isError: note.isError,
        chord: note.chord,
      }),
    );
    rect.style.cursor = 'pointer';
    rect.style.opacity = '0';
    rect.style.transition = 'opacity 0.1s ease-in-out';
    SNPointerLayer.noteRectMap.set(note.index, rect);
    SNPointerLayer.noteInstanceMap.set(note.index, note);
    SNPointerLayer.el.appendChild(rect);
    return rect;
  }

  /**
   * 显示指定音符的矩形
   */
  static showNoteRect(index: number) {
    const rect = SNPointerLayer.noteRectMap.get(index);
    if (rect) {
      rect.style.opacity = '1';
    }
  }

  /**
   * 隐藏指定音符的矩形
   */
  static hideNoteRect(index: number) {
    const rect = SNPointerLayer.noteRectMap.get(index);
    if (rect) {
      rect.style.opacity = '0';
    }
  }

  /**
   * 清除所有音符矩形
   */
  static clearNoteRects() {
    SNPointerLayer.noteRectMap.forEach((rect) => {
      rect.remove();
    });
    SNPointerLayer.noteRectMap.clear();
    SNPointerLayer.noteInstanceMap.clear();
  }

  /**
   * 绑定事件
   */
  private static bindEvents() {
    SNPointerLayer.el.addEventListener('mouseover', (e) => {
      const target = e.target as SVGElement;
      const noteIndex = target.getAttribute('note-index');
      if (noteIndex) {
        const index = parseInt(noteIndex);
        SNPointerLayer.showNoteRect(index);
        const note = SNPointerLayer.noteInstanceMap.get(index);
        if (note) {
          SNPointerLayer.event.emit('note:hover', {
            e,
            index,
            note,
          } as SNNoteEventDetail);
        }
      }
    });

    SNPointerLayer.el.addEventListener('mouseout', (e) => {
      const target = e.target as SVGElement;
      const noteIndex = target.getAttribute('note-index');
      if (noteIndex) {
        const index = parseInt(noteIndex);
        SNPointerLayer.hideNoteRect(index);
        const note = SNPointerLayer.noteInstanceMap.get(index);
        if (note) {
          SNPointerLayer.event.emit('note:leave', {
            e,
            index,
            note,
          } as SNNoteEventDetail);
        }
      }
    });

    SNPointerLayer.el.addEventListener('click', (e) => {
      const target = e.target as SVGElement;
      const noteIndex = target.getAttribute('note-index');
      if (noteIndex) {
        const index = parseInt(noteIndex);
        const note = SNPointerLayer.noteInstanceMap.get(index);
        if (note) {
          SNPointerLayer.event.emit('note:click', {
            e,
            index,
            note,
          } as SNNoteEventDetail);
        }
      }
    });

    SNPointerLayer.el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const target = e.target as SVGElement;
      const noteIndex = target.getAttribute('note-index');
      if (noteIndex) {
        const index = parseInt(noteIndex);
        const note = SNPointerLayer.noteInstanceMap.get(index);
        if (note) {
          SNPointerLayer.event.emit('note:contextmenu', {
            e,
            index,
            note,
          } as SNNoteEventDetail);
        }
      }
    });
  }

  /**
   * 显示/移动播放光标
   * @param noteTag sn-tag属性值，如'note-1'
   * @param svgRoot SVG根节点
   */
  static showPointer(noteTag: string) {
    const noteEl = SNPointerLayer.svg.querySelector(
      `[sn-tag="${noteTag}"]`,
    ) as SVGGraphicsElement;
    if (!noteEl) return;
    const bbox = noteEl.getBBox();
    if (!SNPointerLayer.pointerRect) return;
    SNPointerLayer.pointerRect.setAttribute('x', String(bbox.x - 5));
    SNPointerLayer.pointerRect.setAttribute('y', String(bbox.y - 5));
    SNPointerLayer.pointerRect.setAttribute('width', String(bbox.width + 10));
    SNPointerLayer.pointerRect.setAttribute('height', String(bbox.height + 10));
    SNPointerLayer.pointerRect.setAttribute('visibility', 'visible');
  }

  /**
   * 清除播放光标
   */
  static clearPointer() {
    if (SNPointerLayer.pointerRect) {
      SNPointerLayer.pointerRect.setAttribute('visibility', 'hidden');
    }
  }

  /**
   * 销毁
   */
  static destroy() {
    SNPointerLayer.clearNoteRects();
    if (SNPointerLayer.el) {
      SNPointerLayer.el.remove();
    }
  }
}
