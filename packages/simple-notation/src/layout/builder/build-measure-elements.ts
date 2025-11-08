import type { SNParserNode } from '@data/node';
import { SNLayoutElement } from '@layout/node';
import { ScoreConfig } from '@manager/config';
import { getTimeUnitFromNode, measureDuration } from '@core/utils/time-unit';
import { buildElementChildren } from './build-element-children';
import { calculateNodeHeight } from './calculate-height';

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

  // 计算每个元素的起始位置和宽度（基于tick比例）
  let currentTickOffset = 0;
  for (let i = 0; i < elements.length; i++) {
    const dataElement = elements[i];
    const elementDuration = dataElement.duration || 0;

    // 转换元素
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
    const elementWidth = durationRatio * usableWidth;

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
