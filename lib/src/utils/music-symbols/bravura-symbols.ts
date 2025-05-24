import '@fontsource/bravura';
import { SNBravuraMusicSymbol, SNMusicSymbolOptions } from '@types';
import { SvgUtils } from '../svg';

/**
 * Bravura 字体音乐符号实现
 * @class BravuraMusicSymbols
 */
export class BravuraMusicSymbols {
  /**
   * Bravura 符号映射表
   */
  public static readonly SYMBOLS = {
    // 新增升降号符号
    SHARP: '\uED62', // 升号
    DOUBLE_SHARP: '\uED63', // 重升号
    FLAT: '\uED60', // 降号
    DOUBLE_FLAT: '\uED64', // 重降号
    NaTURAL: '\uED61', // 还原号
  };

  /**
   * 获取符号的字符串
   * @param symbolKey
   */
  public static getSymbol(symbolKey: SNBravuraMusicSymbol): string {
    return BravuraMusicSymbols.SYMBOLS[symbolKey];
  }

  /**
   * 创建 Bravura 字体音乐符号 SVG tspan 元素
   * @param symbolKey
   * @param options
   */
  public static createSymbol(
    symbolKey: SNBravuraMusicSymbol,
    options: SNMusicSymbolOptions,
  ): SVGTextElement {
    return SvgUtils.createText({
      x: options.x,
      y: options.y,
      fontSize: options.fontSize ?? 10,
      fontFamily: options.fontFamily ?? 'Bravura',
      text: BravuraMusicSymbols.SYMBOLS[symbolKey],
      dx: options.dx,
      dy: options.dy,
    });
  }
}
