/**
 * 错误处理模块
 *
 * 提供统一的错误基类和错误处理机制，供所有模块使用
 */

/**
 * 错误严重级别
 */
export enum SNErrorLevel {
  /** 信息提示 - 不影响功能 */
  INFO = 'info',
  /** 警告 - 可能影响部分功能 */
  WARNING = 'warning',
  /** 错误 - 影响功能但可恢复 */
  ERROR = 'error',
  /** 致命错误 - 导致功能无法使用 */
  FATAL = 'fatal',
}

/**
 * 错误位置信息
 */
export interface SNErrorPosition {
  /** 行号（从 1 开始） */
  line?: number;
  /** 列号（从 1 开始） */
  column?: number;
  /** 偏移量（从 0 开始） */
  offset?: number;
}

/**
 * 错误元数据
 */
export interface SNErrorMetadata {
  /** 错误严重级别 */
  level?: SNErrorLevel;
  /** 错误位置信息 */
  position?: SNErrorPosition;
  /** 错误上下文（相关代码片段或数据） */
  context?: string;
  /** 建议的修复方案 */
  suggestion?: string;
  /** 相关文档链接 */
  docUrl?: string;
  /** 附加数据 */
  [key: string]: any;
}

/**
 * 简谱错误基类
 *
 * 所有模块的错误都应该继承此类或其子类
 *
 * @example
 * ```typescript
 * // 直接使用基类
 * throw new SNError('操作失败', 'OPERATION_FAILED', {
 *   level: SNErrorLevel.ERROR,
 *   suggestion: '请检查输入参数'
 * });
 *
 * // 继承基类创建自定义错误
 * class MyModuleError extends SNError {
 *   constructor(message: string, metadata?: SNErrorMetadata) {
 *     super(message, 'MY_MODULE_ERROR', metadata);
 *     this.name = 'MyModuleError';
 *   }
 * }
 * ```
 */
export class SNError extends Error {
  /** 错误名称（类名） */
  public name: string;

  /** 错误代码（用于程序化处理） */
  public readonly code: string;

  /** 错误严重级别 */
  public readonly level: SNErrorLevel;

  /** 错误位置信息 */
  public readonly position?: SNErrorPosition;

  /** 错误上下文 */
  public readonly context?: string;

  /** 建议的修复方案 */
  public readonly suggestion?: string;

  /** 相关文档链接 */
  public readonly docUrl?: string;

  /** 原始错误（如果是包装其他错误） */
  public readonly cause?: Error;

  /** 时间戳 */
  public readonly timestamp: Date;

  /** 附加元数据 */
  public readonly metadata: SNErrorMetadata;

  constructor(
    message: string,
    code: string,
    metadata?: SNErrorMetadata,
    cause?: Error,
  ) {
    super(message);

    this.name = 'SNError';
    this.code = code;
    this.level = metadata?.level || SNErrorLevel.ERROR;
    this.position = metadata?.position;
    this.context = metadata?.context;
    this.suggestion = metadata?.suggestion;
    this.docUrl = metadata?.docUrl;
    this.cause = cause;
    this.timestamp = new Date();
    this.metadata = metadata || {};

    // 保持原型链正确
    Object.setPrototypeOf(this, SNError.prototype);
  }

  /**
   * 获取格式化的错误信息
   */
  toString(): string {
    let msg = `[${this.code}] ${this.message}`;

    if (this.position) {
      const pos: string[] = [];
      if (this.position.line !== undefined)
        pos.push(`行 ${this.position.line}`);
      if (this.position.column !== undefined)
        pos.push(`列 ${this.position.column}`);
      if (pos.length > 0) msg += ` (${pos.join(', ')})`;
    }

    if (this.context) {
      msg += `\n上下文: ${this.context}`;
    }

    if (this.suggestion) {
      msg += `\n建议: ${this.suggestion}`;
    }

    if (this.docUrl) {
      msg += `\n文档: ${this.docUrl}`;
    }

    if (this.cause) {
      msg += `\n原因: ${this.cause.message}`;
    }

    return msg;
  }

  /**
   * 转换为 JSON 对象（便于序列化）
   */
  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      level: this.level,
      position: this.position,
      context: this.context,
      suggestion: this.suggestion,
      docUrl: this.docUrl,
      timestamp: this.timestamp.toISOString(),
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
          }
        : undefined,
      metadata: this.metadata,
    };
  }
}

/**
 * 验证错误
 *
 * 当数据验证失败时使用
 */
export class SNValidationError extends SNError {
  constructor(
    message: string,
    code: string = 'VALIDATION_ERROR',
    metadata?: SNErrorMetadata,
    cause?: Error,
  ) {
    super(message, code, metadata, cause);
    this.name = 'SNValidationError';
  }
}

/**
 * 配置错误
 *
 * 当配置不正确时使用
 */
export class SNConfigError extends SNError {
  constructor(
    message: string,
    code: string = 'CONFIG_ERROR',
    metadata?: SNErrorMetadata,
    cause?: Error,
  ) {
    super(message, code, metadata, cause);
    this.name = 'SNConfigError';
  }
}

/**
 * 渲染错误
 *
 * 当渲染过程出错时使用
 */
export class SNRenderError extends SNError {
  constructor(
    message: string,
    code: string = 'RENDER_ERROR',
    metadata?: SNErrorMetadata,
    cause?: Error,
  ) {
    super(message, code, metadata, cause);
    this.name = 'SNRenderError';
  }
}

/**
 * 播放错误
 *
 * 当音频播放出错时使用
 */
export class SNPlaybackError extends SNError {
  constructor(
    message: string,
    code: string = 'PLAYBACK_ERROR',
    metadata?: SNErrorMetadata,
    cause?: Error,
  ) {
    super(message, code, metadata, cause);
    this.name = 'SNPlaybackError';
  }
}

/**
 * 错误处理器类型
 */
export type SNErrorHandler = (error: SNError) => void;

/**
 * 全局错误处理器
 *
 * 用于统一处理和收集错误
 */
export class SNErrorManager {
  private static instance: SNErrorManager;
  private handlers: Set<SNErrorHandler> = new Set();
  private errors: SNError[] = [];
  private maxErrors: number = 100; // 最多保留的错误数量

  private constructor() {}

  /**
   * 获取全局单例
   */
  static getInstance(): SNErrorManager {
    if (!SNErrorManager.instance) {
      SNErrorManager.instance = new SNErrorManager();
    }
    return SNErrorManager.instance;
  }

  /**
   * 注册错误处理器
   */
  onError(handler: SNErrorHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * 处理错误
   */
  handleError(error: SNError): void {
    // 添加到历史记录
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // 触发所有处理器
    this.handlers.forEach((handler) => {
      try {
        handler(error);
      } catch (e) {
        // 防止处理器本身抛出错误
        console.error('错误处理器执行失败:', e);
      }
    });

    // 根据严重级别输出到控制台
    switch (error.level) {
      case SNErrorLevel.INFO:
        console.info(error.toString());
        break;
      case SNErrorLevel.WARNING:
        console.warn(error.toString());
        break;
      case SNErrorLevel.ERROR:
        console.error(error.toString());
        break;
      case SNErrorLevel.FATAL:
        console.error('致命错误:', error.toString());
        break;
    }
  }

  /**
   * 获取错误历史
   */
  getErrors(level?: SNErrorLevel): SNError[] {
    if (level) {
      return this.errors.filter((e) => e.level === level);
    }
    return [...this.errors];
  }

  /**
   * 清除错误历史
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * 设置最大错误保留数量
   */
  setMaxErrors(max: number): void {
    this.maxErrors = max;
    if (this.errors.length > max) {
      this.errors = this.errors.slice(-max);
    }
  }

  /**
   * 清除所有处理器
   */
  clearHandlers(): void {
    this.handlers.clear();
  }

  /**
   * 重置管理器
   */
  reset(): void {
    this.clearErrors();
    this.clearHandlers();
  }
}

/**
 * 便捷函数：抛出并处理错误
 */
export function throwError(error: SNError): never {
  SNErrorManager.getInstance().handleError(error);
  throw error;
}

/**
 * 便捷函数：尝试执行操作，捕获并处理错误
 */
export function tryExecute<T>(
  fn: () => T,
  errorCode: string = 'EXECUTION_ERROR',
  metadata?: SNErrorMetadata,
): T | undefined {
  try {
    return fn();
  } catch (e) {
    const error = new SNError(
      e instanceof Error ? e.message : String(e),
      errorCode,
      metadata,
      e instanceof Error ? e : undefined,
    );
    SNErrorManager.getInstance().handleError(error);
    return undefined;
  }
}

/**
 * 便捷函数：尝试执行异步操作，捕获并处理错误
 */
export async function tryExecuteAsync<T>(
  fn: () => Promise<T>,
  errorCode: string = 'ASYNC_EXECUTION_ERROR',
  metadata?: SNErrorMetadata,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    const error = new SNError(
      e instanceof Error ? e.message : String(e),
      errorCode,
      metadata,
      e instanceof Error ? e : undefined,
    );
    SNErrorManager.getInstance().handleError(error);
    return undefined;
  }
}
