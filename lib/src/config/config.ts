import {
  SNContentOptions,
  SNDebugOptions,
  SNInfoOptions,
  SNOptions,
  SNScoreOptions,
} from '@types';
import DEBUG_OPTIONS from './debug-options';

export class SNConfig {
  static width: number; //svg节点宽度
  static height: number; //svg节点高度
  static content: SNContentOptions; //内容整体配置
  static info: SNInfoOptions; //信息部分配置
  static score: SNScoreOptions; //乐谱部分配置
  static debug: SNDebugOptions = {};

  constructor(container: HTMLDivElement, options?: SNOptions) {
    SNConfig.width = options?.width || container.clientWidth || 500;
    SNConfig.height = options?.height || container.clientHeight || 800;
    SNConfig.content = options?.content || {
      infoShow: true,
      padding: 10,
    };
    SNConfig.info = options?.info || {
      height: 80,
      padding: 10,
    };
    SNConfig.score = options?.score || {
      lineHeight: 50,
      lineSpace: 10,
      padding: 10,
      lyricHeight: 25,
      lineWeight: 200,
      allowOverWeight: 40,
    };
    SNConfig.debug = options?.debug ? DEBUG_OPTIONS : {};
  }

  /**
   * 更新配置
   * @param options
   */
  static update(options: SNOptions) {
    SNConfig.width = options?.width || SNConfig.width;
    SNConfig.height = options?.height || SNConfig.height;
    SNConfig.content = options?.content || SNConfig.content;
    SNConfig.info = options?.info || SNConfig.info;
    SNConfig.score = options?.score || SNConfig.score;
    SNConfig.debug = options?.debug ? DEBUG_OPTIONS : {};
  }
}
