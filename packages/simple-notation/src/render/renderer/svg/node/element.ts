import type { SNLayoutNode } from '@layout/node';
import type { SvgRenderer } from '../svg-renderer';
import { DebugConfigInstance } from '@manager/config';
import type { SNPitch } from '@core/model/music';
import type { SNVoiceMetaClef } from '@data/model/parser';
import { StaffCalculator } from '../../staff-calculator';

/**
 * 从布局节点向上查找谱号信息
 *
 * @param node 布局节点
 * @returns 谱号（默认为高音谱号）
 */
function getClefFromNode(node: SNLayoutNode): SNVoiceMetaClef {
  let current: SNLayoutNode | undefined = node;

  // 向上查找，直到找到 Voice 节点
  while (current) {
    // 检查当前节点的数据是否包含谱号信息
    if (current.data?.type === 'voice') {
      const meta = (current.data as any).meta;
      if (meta && meta.clef) {
        return meta.clef as SNVoiceMetaClef;
      }
    }
    current = current.parent;
  }

  // 默认返回高音谱号
  return 'treble';
}

/**
 * 渲染 ELEMENT 节点
 *
 * @param parent - 父 SVG 元素
 * @param node - ELEMENT 布局节点
 * @param renderer - SVG 渲染器实例
 */
export function renderElement(
  parent: SVGElement,
  node: SNLayoutNode,
  renderer: SvgRenderer,
): void {
  const layout = node.layout;
  if (!layout) return;

  // 创建元素容器组
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', node.id);
  g.setAttribute('layouttype', 'element');
  // 设置数据层类型（如果有对应的数据节点）
  if (node.data?.type) {
    g.setAttribute('datatype', node.data.type);
  }

  // 设置位置
  g.setAttribute('transform', `translate(${layout.x}, ${layout.y})`);

  const width =
    layout.width && typeof layout.width === 'number' ? layout.width : 0;
  const height =
    layout.height && typeof layout.height === 'number' ? layout.height : 20;

  // 根据数据类型绘制更贴近乐谱的图形
  const dataType = node.data?.type;
  if (dataType === 'measure') {
    // 统一的小节内五线谱高度与上下留白（不占满整个 line 高度）
    const staffTop = 6;
    const staffHeight = 30; // 可后续做成配置项
    const staffBottom = staffTop + staffHeight;

    // 判断是否是第一个小节（需要绘制左线）
    const isFirstMeasure =
      node.parent?.children &&
      node.parent.children.length > 0 &&
      node.parent.children[0] === node;

    // 每个小节只绘制右线，第一个小节额外绘制左线
    // 这样可以避免相邻小节的小节线重叠导致看起来更粗
    if (isFirstMeasure) {
      // 第一个小节：绘制左线（作为行的开始）
      const left = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      left.setAttribute('x1', '0');
      left.setAttribute('y1', String(staffTop));
      left.setAttribute('x2', '0');
      left.setAttribute('y2', String(staffBottom));
      left.setAttribute('stroke', '#000');
      left.setAttribute('stroke-width', '1');
      g.appendChild(left);
    }

    // 所有小节都绘制右线
    const right = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line',
    );
    right.setAttribute('x1', String(Math.max(0, width)));
    right.setAttribute('y1', String(staffTop));
    right.setAttribute('x2', String(Math.max(0, width)));
    right.setAttribute('y2', String(staffBottom));
    right.setAttribute('stroke', '#000');
    right.setAttribute('stroke-width', '1');
    g.appendChild(right);

    // 绘制五线谱（仅在有小节的范围内）
    const staffLineCount = 5;
    const gap =
      staffLineCount > 1 ? staffHeight / (staffLineCount - 1) : staffHeight;
    for (let i = 0; i < staffLineCount; i++) {
      const y = staffTop + i * gap;
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', '0');
      l.setAttribute('y1', String(y));
      l.setAttribute('x2', String(Math.max(0, width)));
      l.setAttribute('y2', String(y));
      l.setAttribute('stroke', '#111');
      l.setAttribute('stroke-width', '1');
      g.appendChild(l);
    }
  } else if (dataType === 'note') {
    // 获取音符数据
    const noteData = node.data as any;
    const pitch = noteData?.pitch as SNPitch | undefined;
    const duration = noteData?.duration as number | undefined;

    // 五线谱参数（与 measure 渲染保持一致）
    const staffTop = StaffCalculator.STAFF_CONFIG.staffTop;
    const staffHeight = StaffCalculator.STAFF_CONFIG.staffHeight;

    // 获取谱号
    const clef = getClefFromNode(node);

    // 计算音符位置和渲染属性
    const cx = Math.max(0, width / 2);
    let cy = 21; // 默认在五线谱中部
    let needsStemFlag = false;
    let isFilled = false;
    let stemDirection = true; // 默认向上

    if (pitch) {
      // 默认使用 48 ticks 作为全音符（L:1/4 时）
      const ticksPerWhole = 48;
      const noteDuration = duration || ticksPerWhole;

      // 使用 StaffCalculator 计算音符渲染属性
      const renderProps = StaffCalculator.getNoteRenderProps(
        pitch,
        noteDuration,
        clef,
        ticksPerWhole,
        staffTop,
        staffHeight,
      );

      cy = renderProps.y;
      needsStemFlag = renderProps.needsStem;
      isFilled = renderProps.isFilled;
      stemDirection = renderProps.stemDirection;
    }

    // 绘制符头
    const noteHead = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'ellipse',
    );
    noteHead.setAttribute('cx', String(cx));
    noteHead.setAttribute('cy', String(cy));
    noteHead.setAttribute('rx', '5');
    noteHead.setAttribute('ry', '3.5');

    if (isFilled) {
      // 实心音符：填充黑色
      noteHead.setAttribute('fill', '#000');
    } else {
      // 空心音符：只描边，不填充
      noteHead.setAttribute('fill', 'none');
      noteHead.setAttribute('stroke', '#000');
      noteHead.setAttribute('stroke-width', '1.5');
    }
    g.appendChild(noteHead);

    // 绘制辅助线（如果需要）
    const ledgerLines = StaffCalculator.getLedgerLines(
      cy,
      staffTop,
      staffHeight,
    );
    if (ledgerLines.length > 0) {
      // 辅助线长度应该比音符符头宽度稍长
      const ledgerLineLength = 16; // 辅助线长度（比音符符头宽度稍长）
      const ledgerLineHalfLength = ledgerLineLength / 2;

      ledgerLines.forEach((ledgerY) => {
        const ledgerLine = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line',
        );
        ledgerLine.setAttribute('x1', String(cx - ledgerLineHalfLength));
        ledgerLine.setAttribute('y1', String(ledgerY));
        ledgerLine.setAttribute('x2', String(cx + ledgerLineHalfLength));
        ledgerLine.setAttribute('y2', String(ledgerY));
        ledgerLine.setAttribute('stroke', '#111');
        ledgerLine.setAttribute('stroke-width', '1.5');
        g.appendChild(ledgerLine);
      });
    }

    // 绘制符干（如果需要）
    if (needsStemFlag) {
      const stemLength = 20; // 符干长度
      // stemDirection: true=向上（音符在中间线以下，音高较低），false=向下（音符在中间线及以上，音高较高）
      // 向上时：符干在右侧，向上延伸（右上）
      // 向下时：符干在左侧，向下延伸（左下）
      const stemX = stemDirection ? cx + 5 : cx - 5; // 向上时在右侧，向下时在左侧
      const stemY1 = cy;
      const stemY2 = stemDirection ? cy - stemLength : cy + stemLength; // 向上时向上延伸，向下时向下延伸

      const stem = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      stem.setAttribute('x1', String(stemX));
      stem.setAttribute('y1', String(stemY1));
      stem.setAttribute('x2', String(stemX));
      stem.setAttribute('y2', String(stemY2));
      stem.setAttribute('stroke', '#000');
      stem.setAttribute('stroke-width', '1.5');
      g.appendChild(stem);
    }
  } else if (dataType === 'rest') {
    // 简化的休止符：小矩形居中显示
    const rw = 10;
    const rh = 4;
    const rx = Math.max(0, width / 2 - rw / 2);
    const ry = 10; // 放在五线谱中部附近
    const rest = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rest.setAttribute('x', String(rx));
    rest.setAttribute('y', String(ry));
    rest.setAttribute('width', String(rw));
    rest.setAttribute('height', String(rh));
    rest.setAttribute('fill', '#000');
    g.appendChild(rest);
  } else if (dataType === 'tuplet') {
    // 简化的三连音标记：上方括号 + 数字
    const bracketY = -8; // 在元素上方
    const x0 = 0;
    const x1 = Math.max(0, width);
    // 左短竖线
    const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l1.setAttribute('x1', String(x0));
    l1.setAttribute('y1', String(bracketY));
    l1.setAttribute('x2', String(x0));
    l1.setAttribute('y2', String(bracketY + 6));
    l1.setAttribute('stroke', '#000');
    l1.setAttribute('stroke-width', '1');
    g.appendChild(l1);
    // 横线
    const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l2.setAttribute('x1', String(x0));
    l2.setAttribute('y1', String(bracketY));
    l2.setAttribute('x2', String(x1));
    l2.setAttribute('y2', String(bracketY));
    l2.setAttribute('stroke', '#000');
    l2.setAttribute('stroke-width', '1');
    g.appendChild(l2);
    // 右短竖线
    const l3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l3.setAttribute('x1', String(x1));
    l3.setAttribute('y1', String(bracketY));
    l3.setAttribute('x2', String(x1));
    l3.setAttribute('y2', String(bracketY + 6));
    l3.setAttribute('stroke', '#000');
    l3.setAttribute('stroke-width', '1');
    g.appendChild(l3);
    // 数字（默认使用3）
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String((x0 + x1) / 2));
    text.setAttribute('y', String(bracketY - 2));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '10');
    text.textContent = '3';
    g.appendChild(text);
  } else if (dataType === 'tie') {
    // 简化的连音线：在元素内部绘制一条浅弧
    const x0 = 2;
    const x1 = Math.max(0, width - 2);
    const midX = (x0 + x1) / 2;
    const baseY = 18; // 靠近谱线中部
    const curve = 6; // 弧度
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${x0} ${baseY} Q ${midX} ${baseY + curve} ${x1} ${baseY}`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#000');
    path.setAttribute('stroke-width', '1.2');
    g.appendChild(path);
  } else if (dataType === 'lyric') {
    // 歌词文本：显示在对应音符下方
    const lyricData = node.data as any;
    if (lyricData && typeof lyricData.syllable === 'string') {
      // 查找对应的音符元素（通过 targetId）
      const targetId = lyricData.targetId;
      let targetNoteX = width / 2; // 默认居中
      let targetNoteY = 0; // 默认在顶部

      // 在同一个小节内查找对应的音符元素
      if (targetId && node.parent) {
        const measureElement = node.parent;
        if (measureElement.children) {
          // 查找对应的音符元素
          const targetNote = measureElement.children.find(
            (child) =>
              child.data?.id === targetId && child.data?.type === 'note',
          );

          if (targetNote && targetNote.layout) {
            // 使用目标音符的位置
            const noteX =
              typeof targetNote.layout.x === 'number' ? targetNote.layout.x : 0;
            const noteWidth =
              typeof targetNote.layout.width === 'number'
                ? targetNote.layout.width
                : 0;
            targetNoteX = noteX + noteWidth / 2;
            // 歌词应该显示在音符下方，五线谱底部再往下
            const staffTop = StaffCalculator.STAFF_CONFIG.staffTop;
            const staffHeight = StaffCalculator.STAFF_CONFIG.staffHeight;
            const staffBottom = staffTop + staffHeight;
            targetNoteY = staffBottom + 10 + (lyricData.verseNumber || 0) * 18; // 根据 verseNumber 垂直排列
          }
        }
      }

      // 如果没有找到目标音符，使用默认位置（五线谱下方）
      if (targetNoteY === 0) {
        const staffTop = StaffCalculator.STAFF_CONFIG.staffTop;
        const staffHeight = StaffCalculator.STAFF_CONFIG.staffHeight;
        const staffBottom = staffTop + staffHeight;
        targetNoteY = staffBottom + 10 + (lyricData.verseNumber || 0) * 18;
      }

      const text = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      );
      const fontSize = 14;
      // 歌词位置：相对于当前元素的位置，需要减去当前元素的 y 坐标
      const currentY = layout.y || 0;
      const textY = targetNoteY - currentY;

      text.setAttribute('x', String(targetNoteX - (layout.x || 0)));
      text.setAttribute('y', String(textY));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'hanging');
      text.setAttribute('font-size', String(fontSize));
      text.setAttribute(
        'font-family',
        '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
      );
      text.setAttribute('fill', '#000');
      text.textContent = lyricData.syllable;
      g.appendChild(text);
    }
  } else {
    // 后备：调试背景框（受开关控制）
    if (width > 0 && DebugConfigInstance.isLayerBackgroundEnabled('element')) {
      const rect = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', String(width));
      rect.setAttribute('height', String(Math.max(20, height)));
      rect.setAttribute('fill', '#42a5f5');
      rect.setAttribute('fill-opacity', '0.12');
      rect.setAttribute('stroke', '#90caf9');
      rect.setAttribute('stroke-width', '1');
      g.appendChild(rect);
    }
  }

  // 渲染子节点
  renderer.renderChildren(g, node);

  parent.appendChild(g);
}
