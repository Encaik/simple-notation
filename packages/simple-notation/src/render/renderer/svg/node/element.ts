import type { SNLayoutNode } from '@layout/node';
import type { SvgRenderer } from '../svg-renderer';
import { DebugConfigInstance } from '@manager/config';

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

    // 绘制小节线（左右各一条），与五线谱高度一致
    const left = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    left.setAttribute('x1', '0');
    left.setAttribute('y1', String(staffTop));
    left.setAttribute('x2', '0');
    left.setAttribute('y2', String(staffBottom));
    left.setAttribute('stroke', '#000');
    left.setAttribute('stroke-width', '1');
    g.appendChild(left);

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
    // 简化的音符符头
    const cx = Math.max(0, width / 2);
    const cy = 12; // 暂定放在谱线中部
    const note = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'ellipse',
    );
    note.setAttribute('cx', String(cx));
    note.setAttribute('cy', String(cy));
    note.setAttribute('rx', '5');
    note.setAttribute('ry', '3.5');
    note.setAttribute('fill', '#000');
    g.appendChild(note);
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
