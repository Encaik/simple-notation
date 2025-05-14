/**
 * 用来渲染内容的内容传参
 */
export type SNData = SNTemplate | string;

export interface SNTemplate {
  info: SNDataInfo;
  score: string;
  lyric?: string;
}

export interface SNDataInfo {
  title: string; // 标题
  composer?: string; // 作曲
  lyricist?: string; // 作词
  beat?: string; // 每小节几拍
  time?: string; // 每拍时值
  key?: string; // 调号
  tempo?: string; // 速度
}

/**
 * 简谱数据类型枚举
 * @enum {string}
 */
export enum SNDataType {
  TEMPLATE = 'template', // 默认模板写法
  ABC = 'abc', // abc写法
}
