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

/**
 * Score 级别的元数据（ABC 特有的 tune 元数据）
 *
 * 设计理念：支持冗余存储
 * 1. 通用布局渲染信息（title, subtitle, contributors）同时存储在：
 *    - props 中：布局层统一访问，不关心具体记谱法格式
 *    - meta 中：数据层追溯来源，知道这些字段来自 ABC 的 T:、C: 等字段
 *
 * 2. ABC 特有的元数据仅存储在 meta 中（不参与布局渲染）：
 *    - origin, area, notes, copyright, noteLength 等
 *
 * 根据 ABC 标准 v2.1
 * @see https://abcnotation.com/wiki/abc:standard:v2.1
 */
export interface SNScoreMeta {
  /** 标题（T: 字段）- ABC 特有，冗余存储在 meta 中以便追溯来源 */
  title?: string;
  /** 副标题（第二个 T: 字段）- ABC 特有，冗余存储在 meta 中以便追溯来源 */
  subtitle?: string;
  /** 创作者列表（C: 字段）- ABC 特有，冗余存储在 meta 中以便追溯来源 */
  contributors?: Array<{ name: string; role?: string }>;

  /** 来源/国家（O: 字段）- ABC 特有 */
  origin?: string;
  /** 地区（A: 字段）- ABC 特有 */
  area?: string;
  /** 注释（N: 字段）- ABC 特有 */
  notes?: string;
  /** 版权信息（S: 字段在头部时）- ABC 特有 */
  copyright?: string;
  /** 默认音符长度（L: 字段，如 "1/4", "1/8"）- ABC 特有 */
  noteLength?: string;
  /** 其他 ABC 特有的字段（H:, G:, R:, Z:, D:, F:, B: 等） */
  [key: string]: unknown;
}
