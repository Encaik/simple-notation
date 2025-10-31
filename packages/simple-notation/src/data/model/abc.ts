/**
 * Root 级别的元数据（文件头信息）
 * 根据 ABC 标准 v2.1解析，文件头信息存放在 root.meta 中
 * @see https://abcnotation.com/wiki/abc:standard:v2.1
 */
export interface SNRootMeta {
  /** ABC 版本信息（如 "2.1"，来自 %%abc-2.1） */
  version?: string;
  /** 文件编码（如 "utf-8"，来自 %%encoding utf-8） */
  encoding?: string;
  /** 其他文件级别指令（%% 开头的指令） */
  directives?: Record<string, string>;
  /** 文件级别的注释和说明 */
  comments?: string[];
  /** 文件中包含的 tune 数量 */
  tuneCount?: number;
  [key: string]: unknown;
}
