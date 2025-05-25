class Logger {
  /**
   * 调试模式开关，默认为 false
   */
  static isDebugMode = false;

  /**
   * 输出信息日志
   * @param message - 要输出的信息
   * @param context - 信息的上下文，用于语义化标识问题位置
   */
  static info(message: string, context?: string) {
    const logMessage = context
      ? `[INFO] [${context}] ${message}`
      : `[INFO] ${message}`;
    console.info(logMessage);
  }

  /**
   * 输出警告日志
   * @param message - 要输出的警告信息
   * @param context - 警告的上下文，用于语义化标识问题位置
   */
  static warn(message: string, context?: string) {
    const logMessage = context
      ? `[WARN] [${context}] ${message}`
      : `[WARN] ${message}`;
    console.warn(logMessage);
  }

  /**
   * 输出错误日志
   * @param message - 要输出的错误信息
   * @param context - 错误的上下文，用于语义化标识问题位置
   *
   * 格式应该如下所示：
   * [ERROR] [context] message
   * [ERROR] message
   *
   * context一般为：
   * 1. 文件名
   * 2. 函数名
   *
   * message一般为：
   * 1. 错误信息
   * 2. 错误堆栈
   */
  static error(message: string, context?: string) {
    const logMessage = context
      ? `[ERROR] [${context}] ${message}`
      : `[ERROR] ${message}`;
    console.error(logMessage);
  }

  /**
   * 输出调试日志
   * @param message - 要输出的调试信息
   * @param context - 调试信息的上下文，用于语义化标识问题位置
   */
  static debug(message: string, context?: string) {
    if (Logger.isDebugMode) {
      const logMessage = context
        ? `[DEBUG] [${context}] ${message}`
        : `[DEBUG] ${message}`;
      console.warn(logMessage);
    }
  }
}

export default Logger;
