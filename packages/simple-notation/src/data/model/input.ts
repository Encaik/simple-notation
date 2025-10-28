/**
 * 用于渲染内容的数据类型，可以是模板对象或字符串。
 * @typedef {string} SNData
 */
export type SNParserInputType = SNAbcInput;

export type SNAbcInput = string;

/**
 * 简谱数据类型枚举。
 * @enum {string}
 * @property {string} ABC - abc写法。
 */
export enum SNDataType {
  ABC = 'abc',
}
