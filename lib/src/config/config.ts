import {
  SNContentOptions,
  SNDebugOptions,
  SNInfoOptions,
  SNOptions,
  SNScoreOptions,
} from '@types';
import DEBUG_OPTIONS from './debug-options';
import { Logger } from '@utils';

export class SNConfig {
  static width: number; //svg节点宽度
  static height: number; //svg节点高度
  static content: SNContentOptions; //内容整体配置
  static info: SNInfoOptions; //信息部分配置
  static score: SNScoreOptions; //乐谱部分配置
  static debug: SNDebugOptions = {};

  constructor(container: HTMLDivElement, options?: SNOptions) {
    Logger.debug('constructor 初始化配置', 'SNConfig');
    SNConfig.width = options?.width || container.clientWidth || 500;
    SNConfig.height = options?.height || container.clientHeight || 800;
    SNConfig.content = {
      infoShow: true,
      padding: 20,
      ...options?.content,
    };
    SNConfig.info = {
      height: 80,
      padding: 10,
      ...options?.info,
    };
    SNConfig.score = {
      lineHeight: 50,
      lineSpace: 10,
      padding: 10,
      lyricHeight: 25,
      chordHeight: 0,
      lineWeight: 200,
      allowOverWeight: 40,
      chordType: 'default',
      ...options?.score,
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
    SNConfig.score = {
      ...SNConfig.score,
      ...options?.score,
    };
    SNConfig.debug = options?.debug ? DEBUG_OPTIONS : {};
  }

  static reset(options?: SNOptions) {
    SNConfig.width = options?.width || 500;
    SNConfig.height = options?.height || 800;
    SNConfig.content = {
      infoShow: true,
      padding: 20,
      ...options?.content,
    };
    SNConfig.info = {
      height: 80,
      padding: 10,
      ...options?.info,
    };
    SNConfig.score = {
      lineHeight: 50,
      lineSpace: 10,
      padding: 10,
      lyricHeight: 25,
      chordHeight: 0,
      lineWeight: 200,
      allowOverWeight: 40,
      chordType: 'default',
      ...options?.score,
    };
    SNConfig.debug = options?.debug ? DEBUG_OPTIONS : {};
  }
}
