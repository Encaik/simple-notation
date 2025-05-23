import { SNRuntime } from '@config';
import { AbcParser, TemplateParser } from '@core';
import { SNData, SNDataType, SNTemplate } from '@types';
import { Logger } from '@utils';

export class SNLoader {
  /**
   * 加载简谱数据并重新渲染
   *
   * @param data - 简谱数据，包含谱面信息和音符数据
   * @param type - 数据类型，默认为模板写法（template），可选abc写法
   * @description
   * 这个方法会完全重新加载数据并重绘整个简谱。它会：
   * 1. 更新运行时配置
   * 2. 清除现有内容
   * 3. 重新创建内容组件
   * 4. 绘制信息区域
   * 5. 绘制谱面内容
   */
  static loadData(data: SNData, type: SNDataType = SNDataType.TEMPLATE) {
    // 清除现有内容
    SNRuntime.clear();
    Logger.debug('loadData 加载数据', 'SimpleNotation');
    // 先解析数据，后渲染页面
    if (type === SNDataType.ABC) {
      SNLoader.loadAbcData(data as string);
    } else {
      SNLoader.loadTemplateData(data as SNTemplate);
    }
  }

  static loadAbcData(data: string) {
    const { info, score, parsedScore } = new AbcParser().parse(data);
    new SNRuntime({
      info: info!,
      score: score || '',
      lyric: '',
      parsedScore: parsedScore,
      splitLyrics: [],
      type: SNDataType.ABC,
    });
  }

  static loadTemplateData(data: SNTemplate) {
    const { info, score, lyric } = data;
    const parsedLyric = lyric?.replaceAll('\n', '') || '';
    const { parsedScore } = new TemplateParser().parse(score);
    let splitLyrics: (string | string[])[] = [];
    if (parsedLyric) {
      splitLyrics = SNRuntime.splitLyric(parsedLyric);
    }
    new SNRuntime({
      info,
      score,
      lyric: parsedLyric,
      parsedScore,
      splitLyrics,
      type: SNDataType.TEMPLATE,
    });
  }
}
