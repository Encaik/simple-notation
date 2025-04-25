import '@fontsource/bravura-text';

/**
 * 音乐符号工具类
 *
 * @class MusicSymbols
 * @description
 * 提供音乐符号的绘制和管理功能，使用 Bravura Text 字体
 * 基于 SMuFL (Standard Music Font Layout) 标准
 */
export class MusicSymbols {
  /**
   * 音乐符号的 Unicode 映射
   */
  private static readonly SYMBOLS = {
    // 音符
    QUARTER_NOTE: '\uE1D5', // 四分音符
    HALF_NOTE: '\uE1D3', // 二分音符
    WHOLE_NOTE: '\uE1D2', // 全音符
    EIGHTH_NOTE: '\uE1D7', // 八分音符
    // 力度
    PP: '\uE52B', // pianissimo
    P: '\uE520', // piano
    MP: '\uE52C', // mezzo-piano
    MF: '\uE52D', // mezzo-forte
    F: '\uE522', // forte
    FF: '\uE52F', // fortissimo
    // 其他常用符号可以继续添加
  };

  /**
   * 创建音乐符号文本元素
   *
   * @param symbol - 符号代码，使用 SYMBOLS 中定义的值
   * @param options - SVG文本选项
   * @returns SVG tspan 元素
   */
  public static createSymbol(
    symbol: keyof typeof MusicSymbols.SYMBOLS,
    options: {
      x?: number;
      y?: number;
      fontSize?: number;
      dx?: string;
      dy?: string;
    } = {},
  ): SVGTSpanElement {
    const tspan = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'tspan',
    );
    tspan.setAttribute('font-family', 'Bravura Text');
    if (options.x !== undefined) tspan.setAttribute('x', options.x.toString());
    if (options.y !== undefined) tspan.setAttribute('y', options.y.toString());
    if (options.fontSize !== undefined)
      tspan.setAttribute('font-size', `${options.fontSize}px`);
    if (options.dx !== undefined) tspan.setAttribute('dx', options.dx);
    if (options.dy !== undefined) tspan.setAttribute('dy', options.dy);
    tspan.textContent = this.SYMBOLS[symbol];
    return tspan;
  }

  /**
   * 获取符号的 Unicode 值
   *
   * @param symbol - 符号代码
   * @returns 符号的 Unicode 字符串
   */
  public static getSymbol(symbol: keyof typeof MusicSymbols.SYMBOLS): string {
    return this.SYMBOLS[symbol];
  }
}
