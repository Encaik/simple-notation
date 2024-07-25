import { SNDataInfo, SNInfoOptions } from '@types';
import { SNContent } from './content';
import { SNBox } from '@core';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';

export class SNInfo extends SNBox {
  el: SVGGElement;

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
