import type { SNParserNode } from '@data/node';
import { SNLayoutElement } from '@layout/node';
import { ScoreConfig } from '@manager/config';
import { getTimeUnitFromNode, measureDuration } from '@core/utils/time-unit';
import { buildElementChildren } from './build-element-children';
import { calculateNodeHeight } from './calculate-height';
import { BeamGrouper } from './beam-grouper';

/**
 * 构建 Measure 内部的元素（叶子节点）
 * 按照元素的tick（duration）按比例分配小节宽度，并添加左右padding避免元素顶在小节线上
 * @param elements - Measure 的子元素（Note/Rest/Lyric/Tuplet）
 * @param parentNode - 父节点（Element，即小节）
 * @param scoreConfig - 乐谱配置
 */
export function buildMeasureElements(
  elements: SNParserNode[],
  parentNode: SNLayoutElement,
  scoreConfig: ScoreConfig,
): void {
  if (!elements?.length) return;

  // 获取小节的总duration（通过小节节点获取timeUnit和timeSignature）
  const measureNode = parentNode.data as SNParserNode;
  if (!measureNode) return;

  const timeUnit = getTimeUnitFromNode(measureNode);
  const timeSignature = measureNode.getTimeSignature();
  const measureTotalTicks = measureDuration(timeSignature, timeUnit);

  // 获取小节的实际宽度（已经设置好的）
  const measureWidth =
    typeof parentNode.layout?.width === 'number' ? parentNode.layout.width : 0;

  // 左右padding，避免元素顶在小节线上
  const horizontalPadding = 8; // 可后续做成配置项
  const usableWidth = Math.max(0, measureWidth - horizontalPadding * 2);

  // 过滤出有 duration 的元素（note、rest等），忽略没有 duration 的元素（如 tie、某些装饰元素）
  const elementsWithDuration = elements.filter(
    (el) => el.duration && el.duration > 0,
  );

  // 计算所有有 duration 的元素的总 ticks
  const totalElementsTicks = elementsWithDuration.reduce(
    (sum, el) => sum + (el.duration || 0),
    0,
  );

  // 如果元素的总 ticks 不等于小节的总 ticks，需要调整比例
  // 使用元素实际的总 ticks 来计算比例，确保元素能正确分布
  const ticksForRatio =
    totalElementsTicks > 0 ? totalElementsTicks : measureTotalTicks;

  // 识别符杠组（beam groups）
  const beamGroups = BeamGrouper.groupBeams(elements, timeUnit);

  // 创建索引到符杠组的映射
  const indexToBeamGroup = new Map<number, (typeof beamGroups)[0]>();
  const processedIndices = new Set<number>();

  for (const group of beamGroups) {
    group.noteIndices.forEach((noteIndex) => {
      indexToBeamGroup.set(noteIndex, group);
    });
  }

  // 计算每个元素的起始位置和宽度（基于tick比例）
  let currentTickOffset = 0;
  for (let i = 0; i < elements.length; i++) {
    // 如果这个索引已经被处理过（作为符杠组的一部分），跳过
    if (processedIndices.has(i)) continue;

    const dataElement = elements[i];
    const elementDuration = dataElement.duration || 0;

    // 检查是否属于符杠组
    const beamGroup = indexToBeamGroup.get(i);

    if (beamGroup && beamGroup.noteIndices[0] === i) {
      // 这是符杠组的第一个音符，创建音符组容器
      const noteGroupElement = createNoteGroup(
        beamGroup,
        elements,
        scoreConfig,
        parentNode,
        currentTickOffset,
        ticksForRatio,
        usableWidth,
        horizontalPadding,
      );

      if (noteGroupElement) {
        // 标记这些索引已经被处理
        beamGroup.noteIndices.forEach((idx) => processedIndices.add(idx));

        // 更新 tick 偏移量（整个组的 duration）
        const groupDuration = beamGroup.noteIndices.reduce(
          (sum, idx) => sum + (elements[idx].duration || 0),
          0,
        );
        currentTickOffset += groupDuration;
      }
      continue;
    }

    // 不属于符杠组的普通元素，单独处理
    const layoutElement = transformMeasureElement(
      dataElement,
      scoreConfig,
      parentNode,
    );

    if (!layoutElement || !layoutElement.layout) continue;

    // 对于没有 duration 的元素（如 tie），跳过位置计算，保持默认位置
    if (elementDuration <= 0) {
      // Y坐标使用父节点的padding.top
      if (parentNode.layout) {
        const parentPadding = parentNode.layout.padding ?? {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };
        layoutElement.layout.y = parentPadding.top;
      }

      // 处理元素的 children（歌词等）
      if (dataElement.children?.length) {
        // 对于没有 duration 的元素，使用默认位置和宽度
        const defaultX =
          typeof layoutElement.layout.x === 'number'
            ? layoutElement.layout.x
            : 0;
        const defaultWidth =
          typeof layoutElement.layout.width === 'number'
            ? layoutElement.layout.width
            : 20;
        buildElementChildren(
          dataElement.children,
          layoutElement,
          defaultX,
          defaultWidth,
          scoreConfig,
        );
      }
      continue;
    }

    // 计算元素在小节内的位置（基于tick比例）
    const startRatio = currentTickOffset / ticksForRatio;
    const durationRatio = elementDuration / ticksForRatio;

    // 计算元素的实际位置和宽度
    const elementX = horizontalPadding + startRatio * usableWidth;
    let elementWidth = durationRatio * usableWidth;

    // 如果是附点音符，增加额外宽度用于显示附点符号
    if (dataElement.type === 'note') {
      const noteData = dataElement as any;
      const dotCount = noteData?.dotCount || 0;
      if (dotCount > 0) {
        // 每个附点需要约 8-10px 的额外宽度（附点直径约 3px + 间距）
        const dotWidth = dotCount * 8;
        elementWidth += dotWidth;
      }
    }

    // 更新元素的布局信息
    layoutElement.layout.x = elementX;
    layoutElement.layout.width = Math.max(10, elementWidth); // 最小宽度10px

    // 更新累计的tick偏移
    currentTickOffset += elementDuration;

    // Y坐标使用父节点的padding.top（由布局计算）
    if (parentNode.layout) {
      const parentPadding = parentNode.layout.padding ?? {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
      layoutElement.layout.y = parentPadding.top;
    }

    // 处理元素的 children（歌词等）
    if (dataElement.children?.length) {
      buildElementChildren(
        dataElement.children,
        layoutElement,
        layoutElement.layout.x,
        layoutElement.layout.width,
        scoreConfig,
      );
    }

    // 子节点添加后，立即更新父节点（Measure Element）的高度
    calculateNodeHeight(parentNode);
  }
}

/**
 * 创建音符组（Note Group）
 *
 * 将符杠组内的多个音符包装为一个容器元素，方便渲染层统一处理
 *
 * @param beamGroup - 符杠组信息
 * @param elements - 所有元素
 * @param scoreConfig - 乐谱配置
 * @param parentNode - 父布局节点（小节）
 * @param tickOffset - 当前的 tick 偏移量
 * @param ticksForRatio - 用于计算比例的 ticks 总数
 * @param usableWidth - 可用宽度
 * @param horizontalPadding - 水平padding
 * @returns 音符组布局元素
 */
function createNoteGroup(
  beamGroup: { id: string; noteIndices: number[]; beamCount: number },
  elements: SNParserNode[],
  scoreConfig: ScoreConfig,
  parentNode: SNLayoutElement,
  tickOffset: number,
  ticksForRatio: number,
  usableWidth: number,
  horizontalPadding: number,
): SNLayoutElement | null {
  // 创建音符组容器
  const noteGroupElement = new SNLayoutElement(
    `layout-note-group-${beamGroup.id}`,
  );

  // 创建一个虚拟的数据节点来表示音符组
  const noteGroupData = {
    id: beamGroup.id,
    type: 'note-group',
    beamCount: beamGroup.beamCount,
    children: beamGroup.noteIndices.map((idx) => elements[idx]),
  };
  noteGroupElement.data = noteGroupData as any;

  // 计算音符组的总 duration
  const groupDuration = beamGroup.noteIndices.reduce(
    (sum, idx) => sum + (elements[idx].duration || 0),
    0,
  );

  // 计算音符组在小节内的位置和宽度
  const startRatio = tickOffset / ticksForRatio;
  const durationRatio = groupDuration / ticksForRatio;
  const groupX = horizontalPadding + startRatio * usableWidth;
  const groupWidth = durationRatio * usableWidth;

  // 设置音符组的布局
  noteGroupElement.updateLayout({
    x: groupX,
    y: 0,
    width: Math.max(20, groupWidth),
    height: 0,
  });

  // 添加到父节点
  parentNode.addChildren(noteGroupElement);

  // 在音符组内部创建各个音符的布局
  let innerTickOffset = 0;
  for (let i = 0; i < beamGroup.noteIndices.length; i++) {
    const noteIndex = beamGroup.noteIndices[i];
    const noteElement = elements[noteIndex];
    const noteDuration = noteElement.duration || 0;

    // 创建音符的布局元素
    const noteLayoutElement = transformMeasureElement(
      noteElement,
      scoreConfig,
      noteGroupElement,
    );

    if (noteLayoutElement && noteLayoutElement.layout) {
      // 标记这个音符属于符杠组，渲染时不应该绘制单独的符尾
      (noteLayoutElement as any).beamGroup = {
        groupId: beamGroup.id,
        groupIndex: i,
        totalInGroup: beamGroup.noteIndices.length,
        beamCount: beamGroup.beamCount,
      };

      // 计算音符在音符组内的相对位置
      const noteStartRatio = innerTickOffset / groupDuration;
      const noteDurationRatio = noteDuration / groupDuration;
      const noteX = noteStartRatio * groupWidth;
      let noteWidth = noteDurationRatio * groupWidth;

      // 如果是附点音符，增加额外宽度用于显示附点符号
      const noteData = noteElement as any;
      const dotCount = noteData?.dotCount || 0;
      if (dotCount > 0) {
        // 每个附点需要约 8-10px 的额外宽度（附点直径约 3px + 间距）
        const dotWidth = dotCount * 8;
        noteWidth += dotWidth;
      }

      noteLayoutElement.layout.x = noteX;
      noteLayoutElement.layout.width = Math.max(10, noteWidth);

      // Y坐标使用父节点（小节）的padding.top
      if (parentNode.layout) {
        const parentPadding = parentNode.layout.padding ?? {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };
        noteLayoutElement.layout.y = parentPadding.top;
      }

      // 处理音符的 children（歌词等）
      if (noteElement.children?.length) {
        buildElementChildren(
          noteElement.children,
          noteLayoutElement,
          noteLayoutElement.layout.x,
          noteLayoutElement.layout.width,
          scoreConfig,
        );
      }
    }

    innerTickOffset += noteDuration;
  }

  // 更新父节点高度
  calculateNodeHeight(parentNode);

  return noteGroupElement;
}

/**
 * 转换 Measure 内部的元素（Note/Rest/Lyric等）
 * @param element - 数据层元素节点
 * @param scoreConfig - 乐谱配置
 * @param parentNode - 父布局节点（Element）
 */
function transformMeasureElement(
  element: SNParserNode,
  _scoreConfig: ScoreConfig,
  parentNode: SNLayoutElement,
): SNLayoutElement | null {
  const layoutElement = new SNLayoutElement(`layout-${element.id}`);
  layoutElement.data = element;

  // 根据元素类型设置不同的宽度和高度
  let elementWidth = 20;
  let elementHeight = 0;
  if (element.type === 'note') {
    elementWidth = 30;
  } else if (element.type === 'rest') {
    elementWidth = 25;
  } else if (element.type === 'lyric') {
    elementWidth = 40;
    elementHeight = 14; // 歌词固定高度（对应字体大小 14px）
  } else if (element.type === 'tuplet') {
    elementWidth = 50; // 连音可能包含多个音符
  } else if (element.type === 'tie') {
    elementWidth = 40; // 连音线默认更宽一些
  }

  layoutElement.updateLayout({
    x: 0,
    y: 0,
    width: elementWidth,
    height: elementHeight, // 歌词有固定高度，其他元素自适应
  });

  parentNode.addChildren(layoutElement);
  return layoutElement;
}
