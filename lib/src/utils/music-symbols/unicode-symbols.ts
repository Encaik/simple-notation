import { SNMusicSymbolOptions, SNUnicodeMusicSymbol } from '@types';

/**
 * Unicode Block 音乐符号实现
 * @class UnicodeMusicSymbols
 */
export class UnicodeMusicSymbols {
  /**
   * Unicode Block 符号映射表
   * 这里只举例部分常用符号，后续可补充
   */
  public static readonly SYMBOLS = {
    QUARTER_NOTE: '𝅘𝅥', // 四分音符
    EIGHTH_NOTE: '𝅘𝅥𝅮', // 八分音符
  };

  /**
   * 获取符号的字符串
   * @param symbolKey
   */
  public static getSymbol(symbolKey: SNUnicodeMusicSymbol): string {
    return UnicodeMusicSymbols.SYMBOLS[symbolKey];
  }

  /**
   * 创建 Unicode Block 音乐符号 SVG tspan 元素
   * @param symbolKey
   * @param options
   */
  public static createSymbol(
    symbolKey: SNUnicodeMusicSymbol,
    options: SNMusicSymbolOptions = {},
  ): SVGTextElement {
    const tspan = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'tspan',
    );
    tspan.setAttribute('font-family', options.fontFamily ?? 'serif');
    if (options.x !== undefined) tspan.setAttribute('x', options.x.toString());
    if (options.y !== undefined) tspan.setAttribute('y', options.y.toString());
    tspan.setAttribute('font-size', `${options.fontSize ?? 10}px`);
    if (options.dx !== undefined) tspan.setAttribute('dx', options.dx);
    if (options.dy !== undefined) tspan.setAttribute('dy', options.dy);
    tspan.textContent = UnicodeMusicSymbols.SYMBOLS[symbolKey];
    return tspan;
  }
}
