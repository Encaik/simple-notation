import type { SNLayoutNode } from '@layout/node';
import type { SvgRenderer } from '../svg-renderer';
import type { SNDebugConfig } from '@manager/model/debug-config';
import type { SNPitch } from '@core/model/music';
import { SNAccidental } from '@core/model/music';
import type { SNVoiceMetaClef } from '@data/model/parser';
import { StaffCalculator } from '../../staff-calculator';
import { SvgRenderNode } from './node';

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
 * 绘制升降号符号
 *
 * @param parent - 父 SVG 元素
 * @param accidental - 变音记号类型
 * @param x - 升降号的 x 坐标（通常位于符头左侧）
 * @param y - 升降号的 y 坐标（与音符符头中心对齐）
 */
function renderAccidental(
  parent: SVGElement,
  accidental: SNAccidental,
  x: number,
  y: number,
): void {
  const strokeWidth = 1.5;

  switch (accidental) {
    case SNAccidental.SHARP: {
      // 绘制升号（♯）：两条垂直的平行线，中间有两条斜线
      // 升号宽度约为 4-5px，高度约为 8px
      const width = 4;
      const height = 8;
      const centerX = x - width / 2;
      const centerY = y;

      // 两条垂直的平行线
      const line1 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      line1.setAttribute('x1', String(centerX));
      line1.setAttribute('y1', String(centerY - height / 2));
      line1.setAttribute('x2', String(centerX));
      line1.setAttribute('y2', String(centerY + height / 2));
      line1.setAttribute('stroke', '#000');
      line1.setAttribute('stroke-width', String(strokeWidth));
      parent.appendChild(line1);

      const line2 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      line2.setAttribute('x1', String(centerX + width));
      line2.setAttribute('y1', String(centerY - height / 2));
      line2.setAttribute('x2', String(centerX + width));
      line2.setAttribute('y2', String(centerY + height / 2));
      line2.setAttribute('stroke', '#000');
      line2.setAttribute('stroke-width', String(strokeWidth));
      parent.appendChild(line2);

      // 两条斜线（从左上到右下）
      const slash1 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      slash1.setAttribute('x1', String(centerX - 1));
      slash1.setAttribute('y1', String(centerY - height / 2 + 1));
      slash1.setAttribute('x2', String(centerX + width + 1));
      slash1.setAttribute('y2', String(centerY - height / 2 + 3));
      slash1.setAttribute('stroke', '#000');
      slash1.setAttribute('stroke-width', String(strokeWidth));
      parent.appendChild(slash1);

      const slash2 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      slash2.setAttribute('x1', String(centerX - 1));
      slash2.setAttribute('y1', String(centerY + height / 2 - 3));
      slash2.setAttribute('x2', String(centerX + width + 1));
      slash2.setAttribute('y2', String(centerY + height / 2 - 1));
      slash2.setAttribute('stroke', '#000');
      slash2.setAttribute('stroke-width', String(strokeWidth));
      parent.appendChild(slash2);
      break;
    }

    case SNAccidental.FLAT: {
      // 绘制降号（♭）：一个类似小写字母 b 的形状
      const width = 3;
      const height = 8;
      const centerX = x;
      const centerY = y;

      // 使用路径绘制降号
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      // 降号路径：从顶部开始，向下画一条曲线，然后向右上方弯曲
      const pathData = `M ${centerX} ${centerY - height / 2}
                        Q ${centerX - width} ${centerY - height / 4} ${centerX - width} ${centerY}
                        Q ${centerX - width} ${centerY + height / 4} ${centerX} ${centerY + height / 2}`;
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#000');
      path.setAttribute('stroke-width', String(strokeWidth));
      path.setAttribute('stroke-linecap', 'round');
      parent.appendChild(path);
      break;
    }

    case SNAccidental.NATURAL: {
      // 绘制还原号（♮）：类似一个倾斜的矩形，中间有一条斜线
      const width = 4;
      const height = 8;
      const centerX = x - width / 2;
      const centerY = y;

      // 左侧垂直线
      const leftLine = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      leftLine.setAttribute('x1', String(centerX));
      leftLine.setAttribute('y1', String(centerY - height / 2 + 1));
      leftLine.setAttribute('x2', String(centerX));
      leftLine.setAttribute('y2', String(centerY + height / 2));
      leftLine.setAttribute('stroke', '#000');
      leftLine.setAttribute('stroke-width', String(strokeWidth));
      parent.appendChild(leftLine);

      // 右侧垂直线
      const rightLine = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      rightLine.setAttribute('x1', String(centerX + width));
      rightLine.setAttribute('y1', String(centerY - height / 2));
      rightLine.setAttribute('x2', String(centerX + width));
      rightLine.setAttribute('y2', String(centerY + height / 2 - 1));
      rightLine.setAttribute('stroke', '#000');
      rightLine.setAttribute('stroke-width', String(strokeWidth));
      parent.appendChild(rightLine);

      // 中间的斜线（从左上到右下）
      const middleLine = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      );
      middleLine.setAttribute('x1', String(centerX));
      middleLine.setAttribute('y1', String(centerY - height / 4));
      middleLine.setAttribute('x2', String(centerX + width));
      middleLine.setAttribute('y2', String(centerY + height / 4));
      middleLine.setAttribute('stroke', '#000');
      middleLine.setAttribute('stroke-width', String(strokeWidth));
      parent.appendChild(middleLine);
      break;
    }

    case SNAccidental.DOUBLE_SHARP: {
      // 绘制重升号（×）：两个升号叠加，稍微错开
      const offset = 1.5;
      renderAccidental(parent, SNAccidental.SHARP, x - offset, y);
      renderAccidental(parent, SNAccidental.SHARP, x + offset, y);
      break;
    }

    case SNAccidental.DOUBLE_FLAT: {
      // 绘制重降号（♭♭）：两个降号并排
      const offset = 2;
      renderAccidental(parent, SNAccidental.FLAT, x - offset, y);
      renderAccidental(parent, SNAccidental.FLAT, x + offset, y);
      break;
    }
  }
}

/**
 * ELEMENT 节点渲染器
 */
export class ElementNode extends SvgRenderNode {
  /**
   * 渲染 ELEMENT 节点
   *
   * @param parent - 父 SVG 元素
   * @param node - ELEMENT 布局节点
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

    // 创建元素容器组
    const g = SvgRenderNode.createGroup(node, 'element');

    // 检查是否是元信息标题容器元素（需要居中定位）
    const dataType = (node.data as any)?.type as string | undefined;
    const isMetadataTitleContainer =
      dataType === 'metadata-title-container' ||
      dataType === 'metadata-section-title-container';
    const metadataAlign = isMetadataTitleContainer
      ? ((node.data as any)?.align as string | undefined)
      : undefined;

    // 设置位置
    let x = typeof layout.x === 'number' ? layout.x : 0;
    let y = typeof layout.y === 'number' ? layout.y : 0;

    // 如果是居中的元信息标题容器，且element的宽度撑满了父级，则让element垂直居中定位
    if (
      isMetadataTitleContainer &&
      metadataAlign === 'center' &&
      node.parent &&
      node.parent.layout
    ) {
      const parentWidth =
        typeof node.parent.layout.width === 'number'
          ? node.parent.layout.width
          : 0;
      const elementWidth = typeof layout.width === 'number' ? layout.width : 0;
      // 如果element宽度接近或等于父级宽度，则居中定位
      if (elementWidth > 0 && Math.abs(elementWidth - parentWidth) < 10) {
        // element已经撑满父级，x保持为0即可（因为text会在element内居中）
        // 但为了确保垂直居中，需要调整y
        const parentHeight =
          typeof node.parent.layout.height === 'number'
            ? node.parent.layout.height
            : 0;
        const elementHeight =
          typeof layout.height === 'number' ? layout.height : 0;
        const parentPadding = node.parent.layout.padding || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };
        // 垂直居中：y = 父级padding.top + (父级可用高度 - element高度) / 2
        // 父级可用高度 = 父级高度 - 父级padding.top - 父级padding.bottom
        const parentAvailableHeight =
          parentHeight - parentPadding.top - parentPadding.bottom;
        y = parentPadding.top + (parentAvailableHeight - elementHeight) / 2;
      }
    }

    SvgRenderNode.setTransform(g, x, y);

    const width =
      layout.width && typeof layout.width === 'number' ? layout.width : 0;
    const height =
      layout.height && typeof layout.height === 'number' ? layout.height : 20;

    // 根据数据类型绘制更贴近乐谱的图形
    // dataType已经在上面计算过了，这里直接使用
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
        const l = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line',
        );
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
      const dotCount = noteData?.dotCount as number | undefined;

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
      let flagCount = 0; // 符尾数量
      let accidental: SNAccidental | undefined;

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
        flagCount = renderProps.flagCount;
        accidental = pitch.accidental;
      }

      // 绘制升降号（如果有，应在符头左侧）
      // ABC 文本中明确写了什么升降号，就显示什么升降号
      // undefined 表示没有升降号标记，不显示
      // NATURAL 表示明确写了还原号 =，显示还原号
      if (accidental !== undefined) {
        const accidentalX = cx - 12; // 升降号位于符头左侧，间距约 12px
        renderAccidental(g, accidental, accidentalX, cy);
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

      // 绘制附点（如果有）
      if (dotCount && dotCount > 0) {
        // 附点位置：在符头右侧，水平对齐符头中心
        const dotY = cy - 3; // 附点与符头中心对齐
        const dotXStart = cx + 12; // 从符头右侧开始，间距约8px
        const dotSpacing = 3.5; // 多个附点之间的间距
        const dotRadius = 1.5; // 附点半径

        for (let i = 0; i < dotCount; i++) {
          const dotX = dotXStart + i * dotSpacing;
          const dot = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'circle',
          );
          dot.setAttribute('cx', String(dotX));
          dot.setAttribute('cy', String(dotY));
          dot.setAttribute('r', String(dotRadius));
          dot.setAttribute('fill', '#000');
          g.appendChild(dot);
        }
      }

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

        // 检查是否属于符杠组
        const beamGroup = (node as any).beamGroup as
          | {
              groupId: string;
              groupIndex: number;
              totalInGroup: number;
              beamCount: number;
            }
          | undefined;

        // 只有不属于符杠组的音符才绘制单独的符尾
        // 符杠组内的音符将由符杠连接，不需要单独的符尾
        if (!beamGroup && flagCount > 0) {
          // 符尾从符干末端开始绘制
          const flagStartX = stemX;
          const flagStartY = stemY2;
          const flagSpacing = 3; // 多个符尾之间的垂直间距

          // 根据方向绘制符尾
          for (let i = 0; i < flagCount; i++) {
            // 每个符尾的起始y坐标（考虑多个符尾的间距）
            const currentFlagY = stemDirection
              ? flagStartY + i * flagSpacing // 向上时，符尾从上往下排列
              : flagStartY - i * flagSpacing; // 向下时，符尾从下往上排列

            // 符尾是一条弧线，从符干末端向外延伸
            // 使用二次贝塞尔曲线绘制符尾
            const flagPath = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'path',
            );

            // 符尾的长度和弯曲程度
            const flagLength = 10; // 符尾水平延伸长度
            const flagHeight = 8; // 符尾垂直弯曲高度

            // 根据符干方向确定符尾的方向
            // stemDirection=true（向上）：符尾向右下弯曲
            // stemDirection=false（向下）：符尾向右上弯曲
            let pathD: string;
            if (stemDirection) {
              // 符干向上时，符尾向右下弯曲
              pathD = `M ${flagStartX} ${currentFlagY} Q ${flagStartX + flagLength / 2} ${currentFlagY + flagHeight} ${flagStartX + flagLength} ${currentFlagY + flagHeight / 2}`;
            } else {
              // 符干向下时，符尾向右上弯曲
              pathD = `M ${flagStartX} ${currentFlagY} Q ${flagStartX + flagLength / 2} ${currentFlagY - flagHeight} ${flagStartX + flagLength} ${currentFlagY - flagHeight / 2}`;
            }

            flagPath.setAttribute('d', pathD);
            flagPath.setAttribute('fill', 'none');
            flagPath.setAttribute('stroke', '#000');
            flagPath.setAttribute('stroke-width', '2');
            flagPath.setAttribute('stroke-linecap', 'round');
            g.appendChild(flagPath);
          }
        }
      }

      // 绘制调试框（如果启用）
      if (
        width > 0 &&
        SvgRenderNode.isLayerBackgroundEnabled(debugConfig, 'element')
      ) {
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
    } else if (dataType === 'rest') {
      // 简化的休止符：小矩形居中显示
      const rw = 10;
      const rh = 4;
      const rx = Math.max(0, width / 2 - rw / 2);
      const ry = 10; // 放在五线谱中部附近
      const rest = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
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
      const text = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      );
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
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      const d = `M ${x0} ${baseY} Q ${midX} ${baseY + curve} ${x1} ${baseY}`;
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#000');
      path.setAttribute('stroke-width', '1.2');
      g.appendChild(path);
    } else if (dataType === 'lyric') {
      // 歌词文本：显示在对应音符下方
      // 歌词g元素的transform是 translate(layout.x, layout.y)
      // 需要计算歌词文本相对于歌词g元素的x位置，使其与音符椭圆的cx对齐
      const lyricData = node.data as any;
      if (lyricData && typeof lyricData.syllable === 'string') {
        // 歌词文本的y位置：在音符下方固定距离
        const staffTop = StaffCalculator.STAFF_CONFIG.staffTop;
        const staffHeight = StaffCalculator.STAFF_CONFIG.staffHeight;
        const staffBottom = staffTop + staffHeight;
        const lyricOffset = -10; // 歌词距离五线谱底部的固定距离
        const verseOffset = (lyricData.verseNumber || 0) * 18; // 多行歌词的垂直间距
        const textY = staffBottom + lyricOffset + verseOffset;

        const text = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text',
        );
        const fontSize = 14;
        text.setAttribute('x', String(0));
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
    } else if (
      dataType === 'metadata-title-container' ||
      dataType === 'metadata-section-title-container'
    ) {
      // 元信息标题容器：包含title和subtitle，一起垂直居中
      const metadataData = node.data as any;
      const title = metadataData?.title as string | undefined;
      const subtitle = metadataData?.subtitle as string | undefined;

      // 计算文本位置（水平居中，垂直居中）
      // 如果element的宽度为0或很小，使用父级（line）的宽度来计算居中位置
      let textX = width / 2;
      if (width <= 0 && node.parent && node.parent.layout) {
        const parentWidth =
          typeof node.parent.layout.width === 'number'
            ? node.parent.layout.width
            : 0;
        const parentPadding = node.parent.layout.padding || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };
        // 使用父级可用宽度的一半作为居中位置
        textX = (parentWidth - parentPadding.left - parentPadding.right) / 2;
      }

      // 计算垂直居中位置（相对于element的g元素）
      // 使用element的高度来计算中心位置
      // 注意：element的g元素已经通过transform垂直居中了，所以这里直接使用element的高度
      let centerY = height / 2;
      // 如果element高度为0，使用默认值（基于容器高度）
      if (height <= 0) {
        // 根据是否有subtitle设置默认中心位置
        centerY = subtitle ? 20 : 10; // 有subtitle时中心在20，只有title时中心在10
      }

      // 渲染title
      if (title) {
        const titleFontSize = dataType === 'metadata-title-container' ? 20 : 18;
        const titleText = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text',
        );

        // title的y位置：如果有subtitle，在中心上方；否则在中心
        const titleY = subtitle ? centerY - 10 : centerY;

        titleText.setAttribute('x', String(textX));
        titleText.setAttribute('y', String(titleY));
        titleText.setAttribute('text-anchor', 'middle');
        titleText.setAttribute('dominant-baseline', 'middle');
        titleText.setAttribute('font-size', String(titleFontSize));
        titleText.setAttribute('font-weight', 'bold');
        titleText.setAttribute(
          'font-family',
          '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
        );
        titleText.setAttribute('fill', '#000');
        titleText.textContent = title;
        g.appendChild(titleText);
      }

      // 渲染subtitle
      if (subtitle) {
        const subtitleFontSize =
          dataType === 'metadata-title-container' ? 16 : 14;
        const subtitleText = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text',
        );

        // subtitle的y位置：在中心下方
        const subtitleY = centerY + 12;

        subtitleText.setAttribute('x', String(textX));
        subtitleText.setAttribute('y', String(subtitleY));
        subtitleText.setAttribute('text-anchor', 'middle');
        subtitleText.setAttribute('dominant-baseline', 'middle');
        subtitleText.setAttribute('font-size', String(subtitleFontSize));
        subtitleText.setAttribute('font-weight', 'normal');
        subtitleText.setAttribute(
          'font-family',
          '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
        );
        subtitleText.setAttribute('fill', '#000');
        subtitleText.textContent = subtitle;
        g.appendChild(subtitleText);
      }
    } else if (
      dataType === 'metadata-music-info' ||
      dataType === 'metadata-contributors'
    ) {
      // 元信息文本：调号拍号（左对齐）或作词作曲（右对齐）
      const metadataData = node.data as any;
      if (metadataData && typeof metadataData.text === 'string') {
        const text = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text',
        );
        const fontSize = 14;
        const textY = height / 2; // 垂直居中

        // 根据对齐方式计算文本X坐标
        const align = metadataData.align || 'left';
        let textX = 0;
        let textAnchor: string = 'start';

        if (align === 'center') {
          textX = width / 2;
          textAnchor = 'middle';
        } else if (align === 'right') {
          // 右对齐：文本的右边缘对齐到element的右边缘
          textX = width;
          textAnchor = 'end';
        } else {
          // left：文本的左边缘对齐到element的左边缘（考虑padding）
          const padding = layout.padding || {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          };
          textX = padding.left;
          textAnchor = 'start';
        }

        text.setAttribute('x', String(textX));
        text.setAttribute('y', String(textY));
        text.setAttribute('text-anchor', textAnchor);
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', String(fontSize));
        text.setAttribute(
          'font-family',
          '"SimSun", "STSong", "STFangsong", "FangSong", "FangSong_GB2312", "KaiTi", "KaiTi_GB2312", "STKaiti", "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW", "AR PL UMing TW MBE", "WenQuanYi Micro Hei", serif',
        );
        text.setAttribute('fill', '#000');
        text.textContent = metadataData.text;
        g.appendChild(text);
      }
    } else {
      // 后备：调试背景框（受开关控制）
      if (
        width > 0 &&
        SvgRenderNode.isLayerBackgroundEnabled(debugConfig, 'element')
      ) {
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

    // 如果是音符组（note-group），在所有子节点渲染完成后绘制符杠
    if (dataType === 'note-group' && node.children) {
      ElementNode.renderBeamsForNoteGroup(g, node);
    }

    parent.appendChild(g);
  }

  /**
   * 为音符组渲染符杠
   *
   * @param parent - 父 SVG 元素（音符组的 g 元素）
   * @param noteGroupNode - 音符组布局节点
   */
  private static renderBeamsForNoteGroup(
    parent: SVGElement,
    noteGroupNode: SNLayoutNode,
  ): void {
    if (!noteGroupNode.children || noteGroupNode.children.length < 2) return;

    // 从音符组数据中获取符杠数量
    const noteGroupData = noteGroupNode.data as any;
    const beamCount = noteGroupData?.beamCount || 1;

    // 获取所有音符子节点
    const noteNodes = noteGroupNode.children;

    ElementNode.renderBeamGroup(parent, noteNodes, beamCount, noteGroupNode);
  }

  /**
   * 渲染单个符杠组
   *
   * @param parent - 父 SVG 元素
   * @param noteNodes - 符杠组内的音符节点数组
   * @param beamCount - 符杠数量
   * @param _noteGroupNode - 音符组节点（可选，保留用于future扩展）
   */
  private static renderBeamGroup(
    parent: SVGElement,
    noteNodes: SNLayoutNode[],
    beamCount: number,
    _noteGroupNode?: SNLayoutNode,
  ): void {
    // 计算每个音符的符干位置
    const stemPositions: Array<{
      x: number;
      y1: number;
      y2: number;
      stemUp: boolean;
    }> = [];

    const staffTop = StaffCalculator.STAFF_CONFIG.staffTop;
    const staffHeight = StaffCalculator.STAFF_CONFIG.staffHeight;

    for (const noteNode of noteNodes) {
      const noteData = noteNode.data as any;
      const pitch = noteData?.pitch as SNPitch | undefined;
      const duration = noteData?.duration as number | undefined;

      if (!pitch || !noteNode.layout) continue;

      // 获取谱号
      const clef = getClefFromNode(noteNode);

      // 计算音符位置
      const noteWidth =
        typeof noteNode.layout.width === 'number' ? noteNode.layout.width : 0;
      const noteX =
        typeof noteNode.layout.x === 'number' ? noteNode.layout.x : 0;
      const cx = noteX + noteWidth / 2;

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

      const cy = renderProps.y;
      const stemDirection = renderProps.stemDirection;

      // 计算符干位置
      const stemLength = 20;
      const stemX = stemDirection ? cx + 5 : cx - 5;
      const stemY1 = cy;
      const stemY2 = stemDirection ? cy - stemLength : cy + stemLength;

      stemPositions.push({
        x: stemX,
        y1: stemY1,
        y2: stemY2,
        stemUp: stemDirection,
      });
    }

    if (stemPositions.length < 2) return;

    // 绘制符杠
    // 符杠是连接所有符干末端的直线或斜线
    const firstStem = stemPositions[0];
    const lastStem = stemPositions[stemPositions.length - 1];

    // 符杠的粗细
    const beamThickness = 3;
    // 多个符杠之间的间距
    const beamSpacing = 3;

    // 绘制每一层符杠
    for (let i = 0; i < beamCount; i++) {
      // 符杠的垂直偏移（相对于第一层符杠）
      const offset = i * (beamThickness + beamSpacing);

      // 计算符杠的起始和结束点
      let startY: number, endY: number;

      if (firstStem.stemUp) {
        // 符干向上：符杠在符干顶部，向下偏移
        startY = firstStem.y2 + offset;
        endY = lastStem.y2 + offset;
      } else {
        // 符干向下：符杠在符干底部，向上偏移
        startY = firstStem.y2 - offset;
        endY = lastStem.y2 - offset;
      }

      // 绘制符杠（使用矩形，支持斜线）
      const beamPath = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'polygon',
      );

      // 计算符杠的四个角点
      // 符杠是一个平行四边形
      const x1 = firstStem.x;
      const x2 = lastStem.x;
      const y1Top = startY;
      const y1Bottom = startY + beamThickness;
      const y2Top = endY;
      const y2Bottom = endY + beamThickness;

      const points = `${x1},${y1Top} ${x2},${y2Top} ${x2},${y2Bottom} ${x1},${y1Bottom}`;
      beamPath.setAttribute('points', points);
      beamPath.setAttribute('fill', '#000');
      parent.appendChild(beamPath);
    }
  }
}
