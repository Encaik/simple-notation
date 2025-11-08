import { SNDuration } from '@core/model/ticks';
import { SNMusicProps, SNScoreProps } from '@data/model/props';
import { SNParserNodeType } from '@data/model';

/**
 * 解析器节点的基类
 *
 * 所有解析器节点都继承自此类，提供通用的节点属性和方法。
 *
 * 设计说明：
 * - props 类型说明：
 *   - Score 和 Section: 使用 SNScoreProps（包含音乐属性 + 元信息属性）
 *   - Measure 等其他层级: 使用 SNMusicProps（只有音乐属性）
 * - meta: 存储格式特有的元数据（如 ABC 特有的字段）
 * - props: 存储通用布局渲染信息（所有解析器都可能有的字段）
 *
 * @template T 元数据类型，默认为 Record<string, unknown>
 */
export class SNParserNode<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /** 节点唯一标识符 */
  id: string;
  /** 节点类型 */
  type: SNParserNodeType;
  /** 格式特有的元数据（如 ABC 特有的字段） */
  meta?: T;
  /** 时值（以 ticks 为单位） */
  duration?: SNDuration;
  /** 原始字符串（用于调试和追溯） */
  originStr: string;
  /** 通用布局渲染属性（音乐属性或乐谱属性） */
  props?: SNMusicProps | SNScoreProps | undefined;
  /** 父节点引用 */
  parent?: SNParserNode;
  /** 子节点数组 */
  children?: SNParserNode[];

  /**
   * 创建解析器节点
   *
   * @param id 节点唯一标识符
   * @param originStr 原始字符串（用于调试和追溯）
   * @param type 节点类型
   */
  constructor({
    id,
    originStr,
    type,
  }: Pick<SNParserNode, 'id' | 'originStr' | 'type'>) {
    this.id = id;
    this.originStr = originStr;
    this.type = type;
  }

  /**
   * 添加子节点
   *
   * @param children 单个子节点或子节点数组
   * @returns 返回当前节点实例，支持链式调用
   */
  addChildren(children: SNParserNode | SNParserNode[]): this {
    if (!this.children) {
      this.children = [];
    }
    if (Array.isArray(children)) {
      children.forEach((child) => {
        child.parent = this;
        this.children!.push(child);
      });
    } else {
      children.parent = this;
      this.children.push(children);
    }
    return this;
  }

  /**
   * 设置元数据
   *
   * @param meta 元数据对象
   * @returns 返回当前节点实例，支持链式调用
   */
  setMeta(meta: T): this {
    this.meta = meta;
    return this;
  }

  /**
   * 设置属性（音乐属性或乐谱属性）
   *
   * @param props 属性对象（SNMusicProps 或 SNScoreProps）
   * @returns 返回当前节点实例，支持链式调用
   */
  setProps(props: SNMusicProps | SNScoreProps): this {
    this.props = props;
    return this;
  }

  /**
   * 设置时值（duration）
   *
   * @param duration 时值（以 ticks 为单位）
   * @returns 返回当前节点实例，支持链式调用
   */
  setDuration(duration: SNDuration): this {
    this.duration = duration;
    return this;
  }

  /**
   * 向上查找拍号（若未设置则返回 4/4）
   *
   * 从当前节点开始向上追溯父节点，查找最近定义的拍号
   *
   * @returns 拍号对象，包含 numerator（分子）和 denominator（分母）
   */
  getTimeSignature(): { numerator: number; denominator: number } {
    // 从当前节点开始向上遍历父节点链
    let current: SNParserNode | undefined = this.parent;
    while (current) {
      const props = current.props as SNMusicProps | SNScoreProps | undefined;
      if (
        props?.timeSignature &&
        typeof props.timeSignature.numerator === 'number' &&
        typeof props.timeSignature.denominator === 'number'
      ) {
        return {
          numerator: props.timeSignature.numerator,
          denominator: props.timeSignature.denominator,
        };
      }
      current = current.parent;
    }
    // 如果找不到，返回默认值 4/4
    return { numerator: 4, denominator: 4 };
  }
}
