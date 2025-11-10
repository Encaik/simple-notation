/**
 * ABC 解析器模块
 *
 * 提供各种专门的解析器，用于处理不同层级的 ABC 内容
 *
 * 文件职责说明：
 * - header-parser.ts: 解析 ABC 头部信息（Root/Score/Section）
 * - score-parser.ts: 解析 Score 层级（分割头部/主体/Section）
 * - section-parser.ts: 解析 Section 层级（提取 ID/头部/内容）
 * - voice-parser.ts: 解析 Voice 层级（提取元数据/歌词/小节）
 * - measure-parser.ts: 解析 Measure 层级（小节内容/调号/声部/歌词关联）
 * - element-parser.ts: 解析 Element 层级（音符/休止符/连音/连音线）
 * - lyric-parser.ts: 解析歌词（提取/分割/对齐）
 */

export * from './header-parser';
export * from './score-parser';
export * from './section-parser';
export * from './voice-parser';
export * from './measure-parser';
export * from './element-parser';
export * from './lyric-parser';
