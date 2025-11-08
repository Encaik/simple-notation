import { SNLayoutElement } from '@layout/node';
import { ScoreConfig } from '@manager/config';
import type { SNParserNode } from '@data/node';
import type {
  SNLayoutLine,
  SNLayoutElement as SNLayoutElementType,
} from '@layout/node';

/**
 * 转换 Measure 节点
 * @param measure - 数据层 Measure 节点
 * @param scoreConfig - 乐谱配置
 * @param parentNode - 父布局节点（Line）
 */
export function transformMeasure(
  measure: SNParserNode,
  _scoreConfig: ScoreConfig,
  parentNode: SNLayoutLine,
): SNLayoutElementType | null {
  if (measure.type !== 'measure') {
    return null;
  }

  const element = new SNLayoutElement(`layout-${measure.id}`);
  element.data = measure;

  element.updateLayout({
    x: 0,
    y: 0,
    width: 100, // 临时值，后续会根据实际音符宽度计算
    height: 0, // 自适应行高
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  parentNode.addChildren(element);
  return element;
}

/**
 * 转换 Measure 内部的元素（Note/Rest/Lyric等）
 * @param element - 数据层元素节点
 * @param scoreConfig - 乐谱配置
 * @param parentNode - 父布局节点（Element）
 */
export function transformMeasureElement(
  element: SNParserNode,
  _scoreConfig: ScoreConfig,
  parentNode: SNLayoutElementType,
): SNLayoutElementType | null {
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
