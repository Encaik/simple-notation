/**
 * ABC 解析错误定义
 *
 * 专门处理 ABC 格式解析过程中的错误
 * 继承自数据层通用错误类
 */

import { SNParseError, SNMeasureDurationError } from '@data/errors';
import { SNErrorLevel, SNErrorMetadata } from '@core/error';

/**
 * ABC 解析错误基类
 *
 * 所有 ABC 相关错误的基础类
 */
export class AbcParseError extends SNParseError {
  constructor(
    message: string,
    code: string = 'ABC_PARSE_ERROR',
    metadata?: SNErrorMetadata,
    cause?: Error,
  ) {
    super(message, code, metadata, cause);
    this.name = 'AbcParseError';
  }
}

/**
 * ABC 头部解析错误
 *
 * 当无法解析 ABC 头部字段时抛出
 */
export class AbcHeaderParseError extends AbcParseError {
  /** 字段名称 */
  public readonly fieldName: string;
  /** 字段值 */
  public readonly fieldValue: string;

  constructor(fieldName: string, fieldValue: string, reason: string) {
    const message = `无法解析 ABC 头部字段 ${fieldName}: ${reason}`;
    super(message, 'ABC_HEADER_PARSE_ERROR', {
      level: SNErrorLevel.ERROR,
      context: `${fieldName}: ${fieldValue}`,
      suggestion: '请检查字段格式是否符合 ABC 规范',
      docUrl: 'https://abcnotation.com/wiki/abc:standard:v2.1#header',
    });
    this.name = 'AbcHeaderParseError';
    this.fieldName = fieldName;
    this.fieldValue = fieldValue;
  }
}

/**
 * ABC 小节解析错误
 *
 * 当 ABC 小节时值不匹配等问题时抛出
 */
export class AbcMeasureParseError extends AbcParseError {
  /** 小节索引 */
  public readonly measureIndex: number;
  /** ABC 原始小节内容 */
  public readonly measureContent?: string;

  constructor(
    measureIndex: number,
    reason: string,
    measureContent?: string,
    metadata?: SNErrorMetadata,
  ) {
    const message = `ABC 小节 ${measureIndex} 解析错误: ${reason}`;
    super(message, 'ABC_MEASURE_PARSE_ERROR', {
      ...metadata,
      level: metadata?.level || SNErrorLevel.ERROR,
      context: metadata?.context || measureContent,
      suggestion: '请检查小节内音符时值总和是否等于拍号要求',
    });
    this.name = 'AbcMeasureParseError';
    this.measureIndex = measureIndex;
    this.measureContent = measureContent;
  }
}

/**
 * ABC 元素解析错误
 *
 * 当无法解析 ABC 音符、休止符等元素时抛出
 */
export class AbcElementParseError extends SNParseError {
  /** ABC 原始元素数据 */
  public readonly abcElementData: string;

  constructor(elementData: string, metadata?: SNErrorMetadata, cause?: Error) {
    const message = `无法解析 ABC 元素: ${elementData}`;
    super(
      message,
      'ABC_ELEMENT_PARSE_ERROR',
      {
        ...metadata,
        context: metadata?.context || elementData,
        level: metadata?.level || SNErrorLevel.ERROR,
      },
      cause,
    );
    this.name = 'AbcElementParseError';
    this.abcElementData = elementData;
  }
}

/**
 * ABC 语法错误
 *
 * 当遇到不符合 ABC 语法规范的内容时抛出
 */
export class AbcSyntaxError extends SNParseError {
  /** ABC 原始文本 */
  public readonly abcText: string;

  constructor(text: string, reason: string, metadata?: SNErrorMetadata) {
    const message = `ABC 语法错误: ${reason}`;
    super(message, 'ABC_SYNTAX_ERROR', {
      ...metadata,
      context: metadata?.context || text,
      level: metadata?.level || SNErrorLevel.ERROR,
    });
    this.name = 'AbcSyntaxError';
    this.abcText = text;
  }
}

/**
 * ABC 小节时值错误
 *
 * 当 ABC 小节时值总和不匹配拍号时抛出
 */
export class AbcMeasureDurationError extends SNMeasureDurationError {
  /** ABC 原始小节内容 */
  public readonly abcMeasureContent?: string;

  constructor(
    measureIndex: number,
    expected: number,
    actual: number,
    abcMeasureContent?: string,
  ) {
    super(measureIndex, expected, actual, abcMeasureContent);
    this.name = 'AbcMeasureDurationError';
    this.abcMeasureContent = abcMeasureContent;
    // 注意：code 继承自 SNMeasureDurationError，已经是 'MEASURE_DURATION_ERROR'
  }
}

/**
 * ABC 版本不支持错误
 *
 * 当遇到不支持的 ABC 版本时抛出
 */
export class AbcVersionNotSupportedError extends AbcParseError {
  /** ABC 版本号 */
  public readonly version: string;

  constructor(version: string, metadata?: SNErrorMetadata) {
    const message = `不支持的 ABC 版本: ${version}`;
    super(message, 'ABC_VERSION_NOT_SUPPORTED', {
      ...metadata,
      level: metadata?.level || SNErrorLevel.ERROR,
      suggestion: '请使用支持的 ABC 版本（如 2.1）',
      docUrl: 'https://abcnotation.com/wiki/abc:standard',
    });
    this.name = 'AbcVersionNotSupportedError';
    this.version = version;
  }
}

/**
 * ABC 字段格式错误
 *
 * 当 ABC 字段格式不正确时抛出
 */
export class AbcFieldFormatError extends AbcParseError {
  /** 字段名称 */
  public readonly fieldName: string;
  /** 字段值 */
  public readonly fieldValue: string;
  /** 期望的格式 */
  public readonly expectedFormat: string;

  constructor(
    fieldName: string,
    fieldValue: string,
    expectedFormat: string,
    metadata?: SNErrorMetadata,
  ) {
    const message = `ABC 字段 ${fieldName} 格式错误: 期望格式 ${expectedFormat}`;
    super(message, 'ABC_FIELD_FORMAT_ERROR', {
      ...metadata,
      level: metadata?.level || SNErrorLevel.ERROR,
      context: `${fieldName}: ${fieldValue}`,
      suggestion: `请按照 ${expectedFormat} 格式填写 ${fieldName} 字段`,
    });
    this.name = 'AbcFieldFormatError';
    this.fieldName = fieldName;
    this.fieldValue = fieldValue;
    this.expectedFormat = expectedFormat;
  }
}

/**
 * ABC 声部解析错误
 *
 * 当无法解析 ABC 声部信息时抛出
 */
export class AbcVoiceParseError extends AbcParseError {
  /** 声部标识符 */
  public readonly voiceId?: string;
  /** 声部内容 */
  public readonly voiceContent?: string;

  constructor(
    reason: string,
    voiceId?: string,
    voiceContent?: string,
    metadata?: SNErrorMetadata,
  ) {
    const message = `ABC 声部解析错误: ${reason}`;
    super(message, 'ABC_VOICE_PARSE_ERROR', {
      ...metadata,
      level: metadata?.level || SNErrorLevel.ERROR,
      context: metadata?.context || voiceContent,
    });
    this.name = 'AbcVoiceParseError';
    this.voiceId = voiceId;
    this.voiceContent = voiceContent;
  }
}

/**
 * ABC 调号解析错误
 *
 * 当无法解析 ABC 调号信息时抛出
 */
export class AbcKeySignatureParseError extends AbcParseError {
  /** 调号字符串 */
  public readonly keySignature: string;

  constructor(
    keySignature: string,
    reason: string,
    metadata?: SNErrorMetadata,
  ) {
    const message = `ABC 调号解析错误: ${reason}`;
    super(message, 'ABC_KEY_SIGNATURE_PARSE_ERROR', {
      ...metadata,
      level: metadata?.level || SNErrorLevel.ERROR,
      context: metadata?.context || keySignature,
      suggestion: '请检查调号格式，如 "C", "Gmaj", "Am" 等',
    });
    this.name = 'AbcKeySignatureParseError';
    this.keySignature = keySignature;
  }
}

/**
 * ABC 拍号解析错误
 *
 * 当无法解析 ABC 拍号信息时抛出
 */
export class AbcTimeSignatureParseError extends AbcParseError {
  /** 拍号字符串 */
  public readonly timeSignature: string;

  constructor(
    timeSignature: string,
    reason: string,
    metadata?: SNErrorMetadata,
  ) {
    const message = `ABC 拍号解析错误: ${reason}`;
    super(message, 'ABC_TIME_SIGNATURE_PARSE_ERROR', {
      ...metadata,
      level: metadata?.level || SNErrorLevel.ERROR,
      context: metadata?.context || timeSignature,
      suggestion: '请检查拍号格式，如 "4/4", "3/4", "C" (4/4), "C|" (2/2) 等',
    });
    this.name = 'AbcTimeSignatureParseError';
    this.timeSignature = timeSignature;
  }
}
