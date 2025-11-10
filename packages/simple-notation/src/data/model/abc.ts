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
 * 设计理念：
 * 1. 通用布局渲染信息（title, subtitle, contributors）存储在 props 中，meta 不做冗余存储
 * 2. ABC 特有的元数据仅存储在 meta 中（不参与布局渲染）：
 *    - origin, area, notes, copyright, noteLength 等
 *
 * 根据 ABC 标准 v2.1/v2.2
 * @see https://abcnotation.com/wiki/abc:standard:v2.1
 * @see https://abcnotation.com/wiki/abc:standard:v2.2
 */
export interface SNScoreMeta {
  /** 来源/国家（O: 字段）- ABC 特有 */
  origin?: string;
  /** 地区（A: 字段）- ABC 特有 */
  area?: string;
  /** 注释（N: 字段）- ABC 特有 */
  notes?: string;
  /** 版权信息/来源（S: 字段在头部时）- ABC 特有 */
  copyright?: string;
  /** 节奏类型（R: 字段，如 "Jig", "Reel", "Waltz"）- ABC 特有 */
  rhythm?: string;
  /** 转录者信息（Z: 字段）- ABC 特有 */
  transcription?: string;
  /** 历史信息（H: 字段）- ABC 特有 */
  history?: string;
  /** 唱片信息（D: 字段）- ABC 特有 */
  discography?: string;
  /** 书籍来源（B: 字段）- ABC 特有 */
  book?: string;
  /** 文件 URL（F: 字段）- ABC 特有 */
  fileUrl?: string;
  /** 组/集合（G: 字段）- ABC 特有 */
  group?: string;
  /** 乐曲结构（P: 字段，如 "AABB", "ABAC"）- ABC 特有 */
  parts?: string;
  /** 默认音符长度（L: 字段，如 "1/4", "1/8"）- ABC 特有，已转换为 timeUnit 存储在 props 中 */
  noteLength?: string;
  /** 其他 ABC 特有的字段 */
  [key: string]: unknown;
}

/**
 * Section 级别的元数据（ABC 特有的 section 元数据）
 *
 * 设计理念：
 * 1. 通用布局渲染信息（title, subtitle, contributors）存储在 props 中，meta 不做冗余存储
 * 2. ABC 特有的元数据仅存储在 meta 中（不参与布局渲染）：
 *    - sectionId, noteLength 等
 *
 * 根据 ABC 标准 v2.1，Section 可以有自己的标题、拍号、调号、速度等
 * @see https://abcnotation.com/wiki/abc:standard:v2.1
 */
export interface SNSectionMeta {
  /** 默认音符长度（L: 字段，如 "1/4", "1/8"）- ABC 特有，已转换为 timeUnit 存储在 props 中 */
  noteLength?: string;
  /** Section 标识符（S: 字段的值）- ABC 特有 */
  sectionId?: string;
  /** 其他 ABC 特有的字段 */
  [key: string]: unknown;
}
