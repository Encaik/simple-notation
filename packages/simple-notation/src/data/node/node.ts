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
   * 通用的向上查找属性方法
   *
   * 从父节点开始向上追溯，查找最近定义的属性
   *
   * @param propName - 属性名称
   * @param defaultValue - 默认值
   * @param validator - 可选的验证函数
   * @returns 找到的属性值或默认值
   */
  protected findInheritedProp<T>(
    propName: string,
    defaultValue: T,
    validator?: (value: any) => boolean,
  ): T {
    let current: SNParserNode | undefined = this.parent;
    while (current) {
      const props = current.props as any;
      const value = props?.[propName];

      if (value !== undefined) {
        // 如果提供了验证器，使用验证器检查
        if (validator ? validator(value) : true) {
          return value as T;
        }
      }
      current = current.parent;
    }
    return defaultValue;
  }

  /**
   * 向上查找拍号（若未设置则返回 4/4）
   *
   * @returns 拍号对象，包含 numerator（分子）和 denominator（分母）
   */
  getTimeSignature(): { numerator: number; denominator: number } {
    return this.findInheritedProp(
      'timeSignature',
      { numerator: 4, denominator: 4 },
      (value) =>
        typeof value?.numerator === 'number' &&
        typeof value?.denominator === 'number',
    );
  }

  /**
   * 向上查找调号（若未设置则返回 C 大调）
   *
   * @returns 调号对象，包含 letter（字母）和 symbol（符号）
   */
  getKeySignature(): { letter: string; symbol: 'natural' | 'sharp' | 'flat' } {
    return this.findInheritedProp('keySignature', {
      letter: 'C',
      symbol: 'natural',
    });
  }

  /**
   * 向上查找速度（若未设置则返回 120 BPM）
   *
   * @returns 速度对象，包含 value（值）和 unit（单位）
   */
  getTempo(): { value: number; unit: 'BPM' } {
    return this.findInheritedProp('tempo', { value: 120, unit: 'BPM' });
  }

  /**
   * 向上查找时间单位（若未设置则返回默认值）
   *
   * @returns 时间单位对象，包含 ticksPerWhole 和 ticksPerBeat
   */
  getTimeUnit(): { ticksPerWhole: number; ticksPerBeat: number } {
    return this.findInheritedProp('timeUnit', {
      ticksPerWhole: 48,
      ticksPerBeat: 12,
    });
  }

  /**
   * 向上查找声部定义列表（若未设置则返回空数组）
   *
   * 从当前节点开始向上追溯父节点，查找最近定义的声部定义列表
   * 支持向上覆盖：Section 的声部定义会覆盖 Score 的同一声部定义
   * 从子节点到父节点遍历，子节点的定义会覆盖父节点的定义
   *
   * @returns 声部定义数组
   */
  getVoices(): Array<{
    voiceNumber: string;
    name?: string;
    clef?: 'treble' | 'bass' | 'alto' | 'tenor';
    transpose?: number;
    [key: string]: unknown;
  }> {
    // 收集所有父节点的声部定义（从子节点到父节点）
    const allVoices: Array<{
      voiceNumber: string;
      name?: string;
      clef?: 'treble' | 'bass' | 'alto' | 'tenor';
      transpose?: number;
      [key: string]: unknown;
    }> = [];

    let current: SNParserNode | undefined = this.parent;
    while (current) {
      const props = current.props as SNScoreProps | undefined;
      if (props?.voices && props.voices.length > 0) {
        allVoices.push(...props.voices);
      }
      current = current.parent;
    }

    // 按 voiceNumber 合并（子节点定义覆盖父节点定义）
    const voicesMap = new Map<string, (typeof allVoices)[0]>();
    for (const voice of allVoices) {
      if (!voicesMap.has(voice.voiceNumber)) {
        voicesMap.set(voice.voiceNumber, { ...voice });
      }
    }

    return Array.from(voicesMap.values());
  }
}
