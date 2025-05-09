import { SNBoxType, SNDataInfo, SNInfoOptions } from '@types';
import { SNContent } from './content';
import { SNBox } from '@core';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';
import { MusicSymbols } from '../utils/music-symbols'; // 假设音乐符号绘制类名为 MusicSymbolDrawer

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
      content,
      SNBoxType.INFO,
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
   * 绘制作词作曲信息组
   *
   * @param composer - 作曲者名称
   * @param lyricist - 作词者名称
   * @returns {SVGTextElement | undefined} 创建的文本元素组
   * @description
   * 在信息区域右下方绘制作词作曲信息，两行左对齐，整体右对齐
   */
  private drawCreatorInfo(composer?: string, lyricist?: string) {
    if (!composer && !lyricist) {
      return;
    }

    // 创建文本组元素
    const textGroup = SvgUtils.createText({
      x: this.innerX + this.innerWidth,
      y: this.innerY + this.innerHeight - 20,
      fontSize: 14,
      fontFamily: 'simsun, sans-serif',
      textAnchor: 'end',
    });

    const createInfoLine = (label: string, content: string, dy: string) => {
      const tspan = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'tspan',
      );
      tspan.setAttribute('x', (this.innerX + this.innerWidth).toString());
      tspan.setAttribute('dy', dy);
      tspan.textContent = `${label}${content}`;
      return tspan;
    };

    // 添加作词信息
    if (lyricist) {
      const lyricistLine = createInfoLine('作词：', lyricist, '0');
      textGroup.appendChild(lyricistLine);
    }

    // 添加作曲信息
    if (composer) {
      const composerLine = createInfoLine(
        '作曲：',
        composer,
        lyricist ? '20' : '0',
      );
      textGroup.appendChild(composerLine);
    }

    this.el.appendChild(textGroup);
    return textGroup;
  }

  /**
   * 绘制调号和速度信息组
   */
  private drawMusicInfo(
    key?: string,
    beat?: string,
    time?: string,
    tempo?: string,
  ) {
    if (!key && !tempo && !beat && !time) {
      return;
    }

    // 创建左侧文本组（调号和速度）
    const leftGroup = SvgUtils.createText({
      x: this.innerX,
      y: this.innerY + this.innerHeight - 20,
      fontSize: 14,
      fontFamily: 'simsun, sans-serif',
      textAnchor: 'start',
    });

    // 添加调号信息
    if (key) {
      const keyLine = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'tspan',
      );
      keyLine.setAttribute('x', this.innerX.toString());
      keyLine.setAttribute('dy', '0');
      keyLine.appendChild(document.createTextNode(`1 = ${key}`));
      leftGroup.appendChild(keyLine);
    }

    // 添加速度信息
    if (tempo) {
      const tempoLine = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'tspan',
      );
      tempoLine.setAttribute('x', this.innerX.toString());
      tempoLine.setAttribute('dy', '20');
      const musicSymbol = MusicSymbols.createSymbol('QUARTER_NOTE');
      tempoLine.appendChild(musicSymbol);
      tempoLine.appendChild(document.createTextNode(` = ${tempo}`));
      leftGroup.appendChild(tempoLine);
    }

    this.el.appendChild(leftGroup);

    // 创建拍号信息（位于调号右侧）
    if (beat && time) {
      const signatureGroup = SvgUtils.createText({
        x: this.innerX + 60,
        y: this.innerY + this.innerHeight - 20,
        fontSize: 14,
        fontFamily: 'simsun, sans-serif',
        textAnchor: 'start',
        text: `${beat}/${time}`,
      });
      this.el.appendChild(signatureGroup);
    }
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
    this.drawCreatorInfo(options.composer, options.lyricist);
    this.drawMusicInfo(options.key, options.beat, options.time, options.tempo);
  }
}
