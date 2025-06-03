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
  /** 存储选中音符矩形的对应关系 */
  static selectedNoteRectMap: Map<number, SVGRectElement> = new Map();

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
   * 创建音符的选中高亮矩形
   */
  static createSelectedNoteRect(note: SNNote): SVGRectElement {
    const bbox = note.el.getBBox();
    const rect = SvgUtils.createRect({
      x: bbox.x - 5,
      y: bbox.y - 5,
      width: bbox.width + 10,
      height: bbox.height + 10,
      fill: 'rgba(255, 255, 0, 0.3)', // 使用黄色作为选中颜色
      rx: SNPointerLayer.ROUND_RADIUS,
      ry: SNPointerLayer.ROUND_RADIUS,
    });
    rect.setAttribute('note-index', note.index.toString());
    rect.style.opacity = '0'; // 初始时隐藏
    rect.style.pointerEvents = 'none'; // 不影响鼠标事件
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
   * 显示指定音符的选中高亮矩形
   */
  static showSelectedNoteHighlight(index: number) {
    let rect = SNPointerLayer.selectedNoteRectMap.get(index);
    if (!rect) {
      const note = SNPointerLayer.noteInstanceMap.get(index);
      if (note) {
        rect = SNPointerLayer.createSelectedNoteRect(note);
        SNPointerLayer.selectedNoteRectMap.set(index, rect);
      }
    }
    if (rect) {
      rect.style.opacity = '1';
    }
  }

  /**
   * 隐藏指定音符的选中高亮矩形
   */
  static hideSelectedNoteHighlight(index: number) {
    const rect = SNPointerLayer.selectedNoteRectMap.get(index);
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
   * 清除所有选中高亮矩形
   */
  static clearSelectedNoteHighlights() {
    SNPointerLayer.selectedNoteRectMap.forEach((rect) => {
      rect.remove();
    });
    SNPointerLayer.selectedNoteRectMap.clear();
  }

  /**
   * 根据文本范围获取包含在该范围内的音符索引列表
   * @param start - 文本选中范围的起始位置
   * @param end - 文本选中范围的结束位置
   * @returns 包含在文本范围内的音符索引数组
   */
  static getNoteIndicesInTextRange(start: number, end: number): number[] {
    const indicesInRange: number[] = [];
    if (start === null || end === null) {
      return indicesInRange; // Return empty array if range is null
    }

    SNPointerLayer.noteInstanceMap.forEach((note: SNNote, index: number) => {
      const [noteStart, noteEnd] = note.getTextRange();
      if (
        noteStart !== undefined &&
        noteEnd !== undefined &&
        // Check if the intersection length is positive
        Math.max(0, Math.min(noteEnd, end) - Math.max(noteStart, start)) > 0 &&
        // Additionally, check if either the note's start or end position is within the selection range
        ((noteStart >= start && noteStart < end) ||
          (noteEnd > start && noteEnd <= end))
      ) {
        indicesInRange.push(index);
      }
    });

    return indicesInRange;
  }

  /**
   * 根据y坐标对音符索引进行分组（简易判断行）
   * @param indices - 音符索引数组
   * @returns 按行分组的音符索引二维数组
   */
  private static groupIndicesByLine(indices: number[]): number[][] {
    if (indices.length === 0) {
      return [];
    }

    // 获取所有需要分组的音符实例，并按y坐标排序
    const notesWithIndices = indices
      .map((index) => {
        const note = SNPointerLayer.noteInstanceMap.get(index);
        return note ? { index, y: note.y } : null;
      })
      .filter((item) => item !== null) as { index: number; y: number }[];

    notesWithIndices.sort((a, b) => a.y - b.y);

    const lines: number[][] = [];
    let currentLine: number[] = [];
    let currentY = -Infinity;
    const yTolerance = 5; // Y坐标容忍度，用于判断是否在同一行

    notesWithIndices.forEach((item) => {
      if (
        currentLine.length === 0 ||
        Math.abs(item.y - currentY) < yTolerance
      ) {
        currentLine.push(item.index);
        currentY = item.y;
      } else {
        lines.push(currentLine);
        currentLine = [item.index];
        currentY = item.y;
      }
    });
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * 计算一组音符的联合边界框
   * @param indices - 音符索引数组
   * @returns 包含 x, y, width, height 的边界框对象，如果数组为空则返回null
   */
  private static getCombinedBBox(indices: number[]): DOMRect | null {
    if (indices.length === 0) {
      return null;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    indices.forEach((index) => {
      const note = SNPointerLayer.noteInstanceMap.get(index);
      if (note) {
        try {
          const bbox = note.el.getBBox();
          minX = Math.min(minX, bbox.x);
          minY = Math.min(minY, bbox.y);
          maxX = Math.max(maxX, bbox.x + bbox.width);
          maxY = Math.max(maxY, bbox.y + bbox.height);
        } catch (e) {
          Logger.error(
            `Failed to get bounding box for note index ${index}: ${e}`,
            'SNPointerLayer',
          );
        }
      }
    });

    if (minX === Infinity) {
      // No valid notes found
      return null;
    }

    // Add some padding around the combined bounding box
    const padding = 5;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const combinedBBox = new DOMRect(minX, minY, maxX - minX, maxY - minY);
    return combinedBBox;
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
    SNPointerLayer.clearSelectedNoteHighlights();
    if (SNPointerLayer.el) {
      SNPointerLayer.el.remove();
    }
  }

  /**
   * 更新选中高亮
   * @param noteIndicesToHighlight 需要高亮的音符索引数组
   */
  static updateSelectionHighlight(noteIndicesToHighlight: number[]) {
    SNPointerLayer.clearSelectedNoteHighlights();

    // Group indices by line first and then find contiguous groups within each line
    const indicesGroupedByLine = SNPointerLayer.groupIndicesByLine(
      noteIndicesToHighlight,
    );

    // Draw a highlight for each contiguous group in each line
    indicesGroupedByLine.forEach((lineIndices) => {
      // Sort indices within the line and find contiguous groups
      const sortedLineIndices = [...lineIndices].sort((a, b) => a - b);
      const contiguousGroupsInLine: number[][] = [];
      let currentGroupInLine: number[] = [];

      sortedLineIndices.forEach((index) => {
        if (
          currentGroupInLine.length === 0 ||
          index === currentGroupInLine[currentGroupInLine.length - 1] + 1
        ) {
          currentGroupInLine.push(index);
        } else {
          contiguousGroupsInLine.push(currentGroupInLine);
          currentGroupInLine = [index];
        }
      });
      if (currentGroupInLine.length > 0) {
        contiguousGroupsInLine.push(currentGroupInLine);
      }

      // Draw a highlight for each contiguous group in this line
      contiguousGroupsInLine.forEach((group) => {
        const combinedBBox = SNPointerLayer.getCombinedBBox(group);
        if (combinedBBox) {
          const rect = SvgUtils.createRect({
            x: combinedBBox.x,
            y: combinedBBox.y,
            width: combinedBBox.width,
            height: combinedBBox.height,
            fill: 'rgba(255, 255, 0, 0.3)', // 使用黄色作为选中颜色
            rx: SNPointerLayer.ROUND_RADIUS,
            ry: SNPointerLayer.ROUND_RADIUS,
          });
          // Store the group's rect indexed by the first note in the group
          SNPointerLayer.selectedNoteRectMap.set(group[0], rect);
          rect.style.pointerEvents = 'none'; // 不影响鼠标事件
          SNPointerLayer.el.appendChild(rect);
        }
      });
    });
  }
}
