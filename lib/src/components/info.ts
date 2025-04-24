import { SNDataInfo, SNInfoOptions } from '@types';
import { SNContent } from './content';
import { SNBox } from '@core';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';

/**
 * SNInfo 类 - 简谱信息区域组件
 *
 * @class SNInfo
 * @extends {SNBox}
 * @description
 * 这个类负责渲染简谱的信息区域，包括标题、作曲者、作词者、
 * 调号、拍号、速度等元数据信息。它继承自 SNBox，具有基本的
 * 布局和边界框功能。
 */
export class SNInfo extends SNBox {
  /** SVG group 元素，作为信息区域的容器 */
  el: SVGGElement;

  /**
   * 创建一个新的信息区域实例
   *
   * @param content - 父级内容容器组件
   * @param options - 信息区域的配置选项
   * @description
   * 构造函数会：
   * 1. 初始化区域的尺寸和内边距
   * 2. 创建 SVG group 元素
   * 3. 绘制调试边界框（如果启用）
   * 4. 初始化空的信息显示
   */
  constructor(content: SNContent, options: SNInfoOptions) {
    super(
      content.innerX,
      content.innerY,
      content.innerWidth,
      options?.height || 100,
      options?.padding,
    );
    this.el = SvgUtils.createG({
      tag: 'info',
    });
    content.el.appendChild(this.el);
    this.drawBorderBox(this.el, SNConfig.debug.borderbox?.info);
    this.draw();
  }

  /**
   * 绘制标题
   *
   * @param title - 简谱标题
   * @returns {SVGTextElement | undefined} 创建的文本元素或 undefined
   * @description
   * 在信息区域中央绘制大号标题文本
   */
  drawTitle(title: string) {
    if (!title) {
      return;
    }
    const text = SvgUtils.createText({
      x: this.innerX + this.innerWidth / 2,
      y: this.innerY + (this.innerHeight - 30) / 2,
      text: title,
      fontSize: 30,
      fontFamily: 'simsun, sans-serif',
      fontWeight: 'bolder',
      textAnchor: 'middle',
    });
    this.el.appendChild(text);
    return text;
  }

  /**
   * 绘制作曲者信息
   *
   * @param composer - 作曲者名称
   * @returns {SVGTextElement | undefined} 创建的文本元素或 undefined
   * @description
   * 在信息区域右下方绘制作曲者信息
   */
  drawComposer(composer?: string) {
    if (!composer) {
      return;
    }
    const text = SvgUtils.createText({
      x: this.innerX + this.innerWidth - 70,
      y: this.innerY + this.innerHeight,
      text: `作曲：${composer}`,
      fontSize: 14,
      fontFamily: 'simsun, sans-serif',
      textAnchor: 'start',
    });
    this.el.appendChild(text);
    return text;
  }

  /**
   * 绘制作词者信息
   *
   * @param lyricist - 作词者名称
   * @returns {SVGTextElement | undefined} 创建的文本元素或 undefined
   * @description
   * 在信息区域右下方绘制作词者信息，位于作曲者信息上方
   */
  drawLyricst(lyricist?: string) {
    if (!lyricist) {
      return;
    }
    const text = SvgUtils.createText({
      x: this.innerX + this.innerWidth - 70,
      y: this.innerY + this.innerHeight - 20,
      text: `谱曲：${lyricist}`,
      fontSize: 14,
      fontFamily: 'simsun, sans-serif',
      textAnchor: 'start',
    });
    this.el.appendChild(text);
    return text;
  }

  /**
   * 绘制拍号信息
   *
   * @param beat - 每小节拍数
   * @param time - 以几分音符为一拍
   * @returns {SVGTextElement | undefined} 创建的文本元素或 undefined
   * @description
   * 在信息区域左下方绘制拍号信息，格式为 "beat/time"
   */
  drawSignure(beat?: string, time?: string) {
    if (!beat || !time) {
      return;
    }
    const text = SvgUtils.createText({
      x: this.innerX + 50,
      y: this.innerY + this.innerHeight - 20,
      text: `${beat}/${time}`,
      fontSize: 14,
      fontFamily: 'simsun, sans-serif',
      fontWeight: 'bolder',
      textAnchor: 'start',
    });
    this.el.appendChild(text);
    return text;
  }

  /**
   * 绘制调号信息
   *
   * @param key - 调号（如 "C"、"G" 等）
   * @returns {SVGTextElement | undefined} 创建的文本元素或 undefined
   * @description
   * 在信息区域左下方绘制调号信息，格式为 "1 = key"
   */
  drawKey(key?: string) {
    if (!key) {
      return;
    }
    const text = SvgUtils.createText({
      x: this.innerX,
      y: this.innerY + this.innerHeight - 20,
      text: `1 = ${key}`,
      fontSize: 14,
      fontFamily: 'simsun, sans-serif',
      textAnchor: 'start',
    });
    this.el.appendChild(text);
    return text;
  }

  /**
   * 绘制速度信息
   *
   * @param tempo - 速度值（每分钟节拍数）
   * @returns {SVGTextElement | undefined} 创建的文本元素或 undefined
   * @description
   * 在信息区域左下方绘制速度信息，格式为 "♩ = tempo"
   */
  drawTempo(tempo?: string) {
    if (!tempo) {
      return;
    }
    const text = SvgUtils.createText({
      x: this.innerX,
      y: this.innerY + this.innerHeight,
      text: `♩ = ${tempo}`,
      fontSize: 14,
      fontFamily: 'simsun, sans-serif',
      textAnchor: 'start',
    });
    this.el.appendChild(text);
    return text;
  }

  /**
   * 绘制所有信息
   *
   * @param options - 包含所有信息字段的数据对象
   * @description
   * 根据提供的数据绘制完整的信息区域，包括标题、作者信息、
   * 调号、拍号和速度等。如果某个字段为空，对应的信息将不会绘制。
   */
  draw(options?: SNDataInfo) {
    if (!options) {
      return;
    }
    this.drawTitle(options.title);
    this.drawComposer(options.composer);
    this.drawLyricst(options.lyricist);
    this.drawSignure(options.beat, options.time);
    this.drawKey(options.key);
    this.drawTempo(options.tempo);
  }
}
