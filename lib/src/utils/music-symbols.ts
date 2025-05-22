import '@fontsource/bravura';

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
  static readonly SYMBOLS = {
    // 数字
    NUMBER_0: '\uE080',
    NUMBER_1: '\uE081',
    NUMBER_2: '\uE082',
    NUMBER_3: '\uE083',
    NUMBER_4: '\uE084',
    NUMBER_5: '\uE085',
    NUMBER_6: '\uE086',
    NUMBER_7: '\uE087',
    NUMBER_8: '\uE088',
    NUMBER_9: '\uE089',
    // 音符符号
    REST: '\uE1D6', // 休止符
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
    // 新增升降号符号
    SHARP: '\uE262', // 升号
    DOUBLE_SHARP: '\uE263', // 重升号
    FLAT: '\uE260', // 降号
    DOUBLE_FLAT: '\uE264', // 重降号
    NaTURAL: '\uE261', // 还原号
    // 新增循环符号
    repeatLeft: '\uE040', // 循环开始符号
    repeatRight: '\uE041', // 循环结束符号
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
    tspan.setAttribute('font-family', 'Bravura');
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
