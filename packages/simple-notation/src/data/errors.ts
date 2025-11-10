/**
 * 数据层通用错误定义
 *
 * 提供数据解析、验证等相关的通用错误类型
 * 各格式解析器（如 ABC）可以继承这些错误类创建特定错误
 */

import {
  SNError,
  SNErrorLevel,
  SNErrorMetadata,
  SNValidationError,
} from '@core/error';

/**
 * 解析错误基类
 *
 * 当数据解析失败时使用
 */
export class SNParseError extends SNError {
  constructor(
    message: string,
    code: string = 'PARSE_ERROR',
    metadata?: SNErrorMetadata,
    cause?: Error,
  ) {
    super(message, code, metadata, cause);
    this.name = 'SNParseError';
  }
}

/**
 * 元素解析错误
 *
 * 当无法解析音符、休止符等元素时抛出
 */
export class SNElementParseError extends SNParseError {
  /** 原始元素数据 */
  public readonly elementData: string;

  constructor(elementData: string, metadata?: SNErrorMetadata, cause?: Error) {
    const message = `无法解析元素: ${elementData}`;
    super(
      message,
      'ELEMENT_PARSE_ERROR',
      {
        ...metadata,
        context: metadata?.context || elementData,
        level: metadata?.level || SNErrorLevel.ERROR,
      },
      cause,
    );
    this.name = 'SNElementParseError';
    this.elementData = elementData;
  }
}

/**
 * 音符解析错误
 *
 * 当无法解析音符信息时抛出
 */
export class SNNoteParseError extends SNParseError {
  /** 音符数据 */
  public readonly noteData: string;

  constructor(noteData: string, reason: string, metadata?: SNErrorMetadata) {
    const message = `音符解析错误: ${reason}`;
    super(message, 'NOTE_PARSE_ERROR', {
      ...metadata,
      context: metadata?.context || noteData,
      level: metadata?.level || SNErrorLevel.ERROR,
    });
    this.name = 'SNNoteParseError';
    this.noteData = noteData;
  }
}

/**
 * 休止符解析错误
 *
 * 当无法解析休止符信息时抛出
 */
export class SNRestParseError extends SNParseError {
  /** 休止符数据 */
  public readonly restData: string;

  constructor(restData: string, reason: string, metadata?: SNErrorMetadata) {
    const message = `休止符解析错误: ${reason}`;
    super(message, 'REST_PARSE_ERROR', {
      ...metadata,
      context: metadata?.context || restData,
      level: metadata?.level || SNErrorLevel.ERROR,
    });
    this.name = 'SNRestParseError';
    this.restData = restData;
  }
}

/**
 * 时值解析错误
 *
 * 当时值计算或验证失败时抛出
 */
export class SNDurationParseError extends SNParseError {
  /** 时值数据 */
  public readonly durationData: string | number;

  constructor(
    durationData: string | number,
    reason: string,
    metadata?: SNErrorMetadata,
  ) {
    const message = `时值解析错误: ${reason}`;
    super(message, 'DURATION_PARSE_ERROR', {
      ...metadata,
      context: metadata?.context || String(durationData),
      level: metadata?.level || SNErrorLevel.ERROR,
    });
    this.name = 'SNDurationParseError';
    this.durationData = durationData;
  }
}

/**
 * 和弦解析错误
 *
 * 当无法解析和弦信息时抛出
 */
export class SNChordParseError extends SNParseError {
  /** 和弦数据 */
  public readonly chordData: string;

  constructor(chordData: string, reason: string, metadata?: SNErrorMetadata) {
    const message = `和弦解析错误: ${reason}`;
    super(message, 'CHORD_PARSE_ERROR', {
      ...metadata,
      context: metadata?.context || chordData,
      level: metadata?.level || SNErrorLevel.WARNING, // 和弦解析失败通常不是致命错误
    });
    this.name = 'SNChordParseError';
    this.chordData = chordData;
  }
}

/**
 * 歌词解析错误
 *
 * 当无法解析歌词信息时抛出
 */
export class SNLyricsParseError extends SNParseError {
  /** 歌词数据 */
  public readonly lyricsData: string;

  constructor(lyricsData: string, reason: string, metadata?: SNErrorMetadata) {
    const message = `歌词解析错误: ${reason}`;
    super(message, 'LYRICS_PARSE_ERROR', {
      ...metadata,
      context: metadata?.context || lyricsData,
      level: metadata?.level || SNErrorLevel.WARNING, // 歌词解析失败通常不是致命错误
    });
    this.name = 'SNLyricsParseError';
    this.lyricsData = lyricsData;
  }
}

/**
 * 小节时值验证错误
 *
 * 当小节时值总和不匹配拍号时抛出
 */
export class SNMeasureDurationError extends SNValidationError {
  /** 小节索引 */
  public readonly measureIndex: number;
  /** 期望的时值（ticks） */
  public readonly expected: number;
  /** 实际的时值（ticks） */
  public readonly actual: number;

  constructor(
    measureIndex: number,
    expected: number,
    actual: number,
    context?: string,
  ) {
    const message = `小节 ${measureIndex} 时值不匹配: 期望 ${expected} ticks，实际 ${actual} ticks`;
    super(message, 'MEASURE_DURATION_ERROR', {
      level: SNErrorLevel.ERROR,
      context,
      suggestion:
        actual < expected
          ? '小节时值不足，请添加音符或休止符'
          : '小节时值超出，请删减音符或检查时值设置',
    });
    this.name = 'SNMeasureDurationError';
    this.measureIndex = measureIndex;
    this.expected = expected;
    this.actual = actual;
  }
}

/**
 * 语法错误
 *
 * 当遇到不符合语法规范的内容时抛出
 */
export class SNSyntaxError extends SNParseError {
  /** 语法错误的原始文本 */
  public readonly text: string;

  constructor(text: string, reason: string, metadata?: SNErrorMetadata) {
    const message = `语法错误: ${reason}`;
    super(message, 'SYNTAX_ERROR', {
      ...metadata,
      context: metadata?.context || text,
      level: metadata?.level || SNErrorLevel.ERROR,
    });
    this.name = 'SNSyntaxError';
    this.text = text;
  }
}

/**
 * 格式不支持错误
 *
 * 当遇到不支持的格式时抛出
 */
export class SNUnsupportedFormatError extends SNParseError {
  /** 格式名称 */
  public readonly format: string;

  constructor(format: string, metadata?: SNErrorMetadata) {
    const message = `不支持的格式: ${format}`;
    super(message, 'UNSUPPORTED_FORMAT_ERROR', {
      ...metadata,
      level: metadata?.level || SNErrorLevel.ERROR,
      suggestion: '请使用支持的格式（如 ABC 记谱法）',
    });
    this.name = 'SNUnsupportedFormatError';
    this.format = format;
  }
}

/**
 * 数据验证错误
 *
 * 当数据不符合预期时抛出
 */
export class SNDataValidationError extends SNValidationError {
  /** 字段名 */
  public readonly field: string;
  /** 期望的值类型或范围 */
  public readonly expected: string;
  /** 实际的值 */
  public readonly actual: any;

  constructor(
    field: string,
    expected: string,
    actual: any,
    metadata?: SNErrorMetadata,
  ) {
    const message = `字段 ${field} 验证失败: 期望 ${expected}，实际 ${JSON.stringify(actual)}`;
    super(message, 'DATA_VALIDATION_ERROR', {
      ...metadata,
      level: metadata?.level || SNErrorLevel.ERROR,
    });
    this.name = 'SNDataValidationError';
    this.field = field;
    this.expected = expected;
    this.actual = actual;
  }
}
