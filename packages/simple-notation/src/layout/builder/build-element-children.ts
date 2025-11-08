import type { SNParserNode } from '@data/node';
import type { SNParserLyric } from '@data/node';
import { SNLayoutElement } from '@layout/node';
import { ScoreConfig } from '@manager/config';
import { calculateNodeHeight } from './calculate-height';

/**
 * 构建元素的子元素（如歌词）
 * @param children - 元素的子节点数组（如歌词）
 * @param parentLayoutElement - 父布局元素节点
 * @param _parentX - 父元素的X坐标（预留参数，暂未使用）
 * @param _parentWidth - 父元素的宽度（预留参数，暂未使用）
 * @param scoreConfig - 乐谱配置
 */
export function buildElementChildren(
  children: SNParserNode[],
  parentLayoutElement: SNLayoutElement,
  _parentX: number,
  _parentWidth: number,
  scoreConfig: ScoreConfig,
): void {
  if (!children?.length) return;

  // 过滤出歌词节点
  const lyrics = children.filter(
    (child) => child.type === 'lyric',
  ) as SNParserLyric[];

  if (lyrics.length === 0) return;

  // 按 verseNumber 分组歌词
  const lyricsByVerse = new Map<number, SNParserLyric[]>();
  for (const lyric of lyrics) {
    if (lyric.skip) continue; // 跳过标记为 skip 的歌词

    const verseNumber = lyric.verseNumber || 0;
    if (!lyricsByVerse.has(verseNumber)) {
      lyricsByVerse.set(verseNumber, []);
    }
    lyricsByVerse.get(verseNumber)!.push(lyric);
  }

  // 为每个歌词行创建布局元素
  // 歌词的Y坐标应该在音符下方，不同 verseNumber 的歌词应该垂直排列
  const lyricLineHeight = 20; // 每行歌词的高度（可后续做成配置项）
  const lyricBaseOffset = 30; // 歌词距离音符的基偏移（可后续做成配置项）

  for (const [verseNumber, verseLyrics] of lyricsByVerse.entries()) {
    // 对每个 verseNumber，可能有多个歌词（如 multi-word 的情况）
    // 这里我们为每个歌词创建一个布局元素
    for (const lyric of verseLyrics) {
      // 转换歌词元素
      const lyricLayoutElement = transformMeasureElement(
        lyric,
        scoreConfig,
        parentLayoutElement,
      );

      if (!lyricLayoutElement || !lyricLayoutElement.layout) continue;

      // 设置歌词的位置
      if (lyric.targetId && parentLayoutElement.parent) {
        // 从measure（parentLayoutElement的父元素）中查找对应的音符元素
        const measureElement = parentLayoutElement.parent;
        if (measureElement.children) {
          const targetNote = measureElement.children.find(
            (child) =>
              child.data?.id === lyric.targetId && child.data?.type === 'note',
          );
          if (targetNote?.layout) {
            const noteWidth =
              typeof targetNote.layout.width === 'number'
                ? targetNote.layout.width
                : 0;
            const noteCx = Math.max(0, noteWidth / 2);
            lyricLayoutElement.layout.x = noteCx;
          }
        }
      }
      // 歌词宽度根据文本内容自适应（这里先设置为文本宽度，后续可以根据实际文本计算）
      lyricLayoutElement.layout.width = Math.max(
        30,
        lyric.syllable.length * 12, // 粗略估算：每个字符12px
      );

      // Y坐标：音符下方，根据 verseNumber 垂直排列
      if (parentLayoutElement.layout) {
        // 歌词的Y坐标 = 父元素的Y + 父元素的高度 + 基偏移 + verseNumber * 行高
        const parentY =
          typeof parentLayoutElement.layout.y === 'number'
            ? parentLayoutElement.layout.y
            : 0;
        const parentHeight =
          typeof parentLayoutElement.layout.height === 'number'
            ? parentLayoutElement.layout.height
            : 0;

        lyricLayoutElement.layout.y =
          parentY +
          parentHeight +
          lyricBaseOffset +
          verseNumber * lyricLineHeight;
      }

      // 歌词元素添加后，立即更新父节点（Measure Element）的高度
      calculateNodeHeight(parentLayoutElement);
    }
  }

  // 所有歌词元素添加完成后，更新父节点（Measure Element）的高度
  // 确保父节点高度包含所有歌词
  calculateNodeHeight(parentLayoutElement);
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
