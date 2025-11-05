import { SNLayoutElement } from '@layout/node';
import { ScoreConfig } from '@manager/config';
import type { SNParserNode } from '@data/node';
import type {
  SNLayoutLine,
  SNLayoutElement as SNLayoutElementType,
} from '@layout/node';

/**
 * Measure 转换器
 *
 * 将数据层的 Measure 节点转换为布局层的 Element 节点
 * 独立不耦合，任意放进去一个 Measure 节点对象，都能产出布局层 Element 对象
 */
export class MeasureTransformer {
  constructor(private scoreConfig: ScoreConfig) {}

  /**
   * 转换 Measure 节点
   *
   * @param measure - 数据层 Measure 节点
   * @param parentNode - 父布局节点（Line）
   * @returns 布局层 Element 节点
   */
  transform(
    measure: SNParserNode,
    parentNode: SNLayoutLine,
  ): SNLayoutElementType | null {
    // 类型检查：确保是 Measure
    if (measure.type !== 'measure') {
      return null;
    }

    const measureConfig = this.scoreConfig.getMeasure();

    // 创建元素节点
    const element = new SNLayoutElement(`layout-${measure.id}`);
    element.data = measure;

    // 设置配置
    const measureGap = measureConfig.spacing.measureGap || 10;
    const measureWidth = 100; // 临时值，后续会根据实际音符宽度计算

    element.updateLayout({
      x: 0, // 初始位置，由布局计算填充
      y: 0, // 初始位置，由布局计算填充
      width: measureWidth,
      height: 0, // 自适应行高
      margin: { top: 0, right: measureGap, bottom: 0, left: 0 },
    });

    // 建立父子关系
    parentNode.addChildren(element);

    return element;
  }

  /**
   * 转换 Measure 内部的元素（Note/Rest/Lyric等）
   *
   * @param element - 数据层元素节点
   * @param parentNode - 父布局节点（Element）
   * @returns 布局层 Element 节点
   */
  transformElement(
    element: SNParserNode,
    parentNode: SNLayoutElementType,
  ): SNLayoutElementType | null {
    // 创建元素节点
    const layoutElement = new SNLayoutElement(`layout-${element.id}`);
    layoutElement.data = element;

    // 根据元素类型设置不同的宽度
    let elementWidth = 20; // 默认宽度
    if (element.type === 'note') {
      elementWidth = 30;
    } else if (element.type === 'rest') {
      elementWidth = 25;
    } else if (element.type === 'lyric') {
      elementWidth = 40;
    } else if (element.type === 'tuplet') {
      elementWidth = 50; // 连音可能包含多个音符
    } else if (element.type === 'tie') {
      elementWidth = 40; // 连音线默认更宽一些
    }

    // 设置配置
    layoutElement.updateLayout({
      x: 0, // 初始位置，由布局计算填充
      y: 0, // 初始位置，由布局计算填充
      width: elementWidth,
      height: 0, // 自适应
    });

    // 建立父子关系
    parentNode.addChildren(layoutElement);

    return layoutElement;
  }
}
