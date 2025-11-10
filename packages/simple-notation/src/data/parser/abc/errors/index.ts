/**
 * ABC 解析错误定义
 *
 * 提供统一的错误类型体系，便于错误追踪和处理
 */

/**
 * ABC 解析错误基类
 *
 * @example
 * ```typescript
 * throw new AbcParseError('解析失败', 'PARSE_ERROR', { line: 1, column: 5 });
 * ```
 */
export class AbcParseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly position?: { line?: number; column?: number },
    public readonly context?: string,
  ) {
    super(message);
    this.name = 'AbcParseError';
  }
}

/**
 * 元素解析错误
 *
 * 当无法解析音符、休止符等元素时抛出
 */
export class ElementParseError extends AbcParseError {
  /** 原始错误（如果有） */
  public readonly cause?: Error;

  constructor(
    elementData: string,
    position?: { line?: number; column?: number },
    cause?: Error,
  ) {
    super(
      `无法解析元素: ${elementData}`,
      'ELEMENT_PARSE_ERROR',
      position,
      elementData,
    );
    this.cause = cause;
  }
}

/**
 * 头部解析错误
 *
 * 当无法解析头部字段时抛出
 */
export class HeaderParseError extends AbcParseError {
  constructor(fieldName: string, fieldValue: string, reason: string) {
    super(
      `无法解析头部字段 ${fieldName}: ${reason}`,
      'HEADER_PARSE_ERROR',
      undefined,
      `${fieldName}: ${fieldValue}`,
    );
  }
}

/**
 * 小节解析错误
 *
 * 当小节时值不匹配等问题时抛出
 */
export class MeasureParseError extends AbcParseError {
  constructor(measureIndex: number, reason: string, context?: string) {
    super(
      `小节 ${measureIndex} 解析错误: ${reason}`,
      'MEASURE_PARSE_ERROR',
      undefined,
      context,
    );
  }
}
