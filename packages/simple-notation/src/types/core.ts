import { SNNote } from '@components';
import { SNStaveOptions } from '@types';
import { SNDataInfo, SNDataType } from '../data/model/input';

/**
 * 表示一个二维坐标点。
 * @property {number} x - x轴坐标。
 * @property {number} y - y轴坐标。
 */
export interface SNPoint {
  x: number;
  y: number;
}

/**
 * 事件回调函数类型
 */
export type EventCallback = (event: CustomEvent) => void;

/**
 * 事件详情类型
 */
export type EventDetail = {
  e: Event;
};

/**
 * 音符事件详情类型
 */
export interface SNNoteEventDetail extends EventDetail {
  /** 音符索引 */
  index: number;
  /** 音符实例 */
  note: SNNote;
}

/**
 * 简谱渲染中的盒子类型枚举。
 * @enum {string}
 */
export enum SNBoxType {
  /** 根节点 */
  ROOT = 'root',
  /** 内容区域 */
  CONTENT = 'content',
  /** 信息区域 */
  INFO = 'info',
  /** 总谱区域 */
  SCORE = 'score',
  /** 乐句区域 */
  STAVE = 'stave',
  /** 小节区域 */
  MEASURE = 'measure',
  /** 音符区域 */
  NOTE = 'note',
}

/**
 * 简谱运行时的核心配置。
 * @property {SNDataInfo} info - 简谱的基本信息。
 * @property {string} score - 原始乐谱字符串。
 * @property {SNStaveOptions[]} parsedScore - 解析后的乐句数组。
 * @property {string} lyric - 歌词字符串。
 * @property {(string | string[])[]} splitLyrics - 拆分后的歌词。
 * @property {SNDataType} type - 简谱数据类型。
 */
export type SNRuntimeOptions = {
  info: SNDataInfo;
  score: string;
  parsedScore: SNStaveOptions[];
  lyric: string;
  splitLyrics: (string | string[])[];
  type: SNDataType;
};
