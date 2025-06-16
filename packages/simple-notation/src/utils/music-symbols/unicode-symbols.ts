import { SNMusicSymbolOptions, SNUnicodeMusicSymbol } from '@types';
import { SvgUtils } from '../svg';

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
    FLAG_1: '𝅮', // 一条小尾巴（八分音符符尾）
    FLAG_2: '𝅯', // 两条小尾巴（十六分音符及以上符尾）
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
    options: SNMusicSymbolOptions,
  ): SVGTextElement {
    return SvgUtils.createTspan({
      x: options.x,
      y: options.y,
      fontSize: options.fontSize ?? 10,
      fontFamily: options.fontFamily ?? 'serif',
      text: UnicodeMusicSymbols.SYMBOLS[symbolKey],
      dx: options.dx,
      dy: options.dy,
    });
  }
}
