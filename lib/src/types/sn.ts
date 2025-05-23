/**
 * 用于渲染内容的数据类型，可以是模板对象或字符串。
 * @typedef {SNTemplate | string} SNData
 */
export type SNData = SNTemplate | string;

/**
 * 简谱模板对象。
 * @property {SNDataInfo} info - 简谱基本信息。
 * @property {string} score - 乐谱内容。
 * @property {string} [lyric] - 歌词内容。
 */
export interface SNTemplate {
  info: SNDataInfo;
  score: string;
  lyric?: string;
}

/**
 * 简谱基本信息。
 * @property {string} title - 标题。
 * @property {string} [composer] - 作曲。
 * @property {string} [lyricist] - 作词。
 * @property {string} [beat] - 每小节几拍。
 * @property {string} [time] - 每拍时值。
 * @property {string} [key] - 调号。
 * @property {string} [tempo] - 速度。
 */
export interface SNDataInfo {
  title: string;
  composer?: string;
  lyricist?: string;
  beat?: string;
  time?: string;
  key?: string;
  tempo?: string;
}

/**
 * 简谱数据类型枚举。
 * @enum {string}
 * @property {string} TEMPLATE - 默认模板写法。
 * @property {string} ABC - abc写法。
 */
export enum SNDataType {
  TEMPLATE = 'template',
  ABC = 'abc',
}
