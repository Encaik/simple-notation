/**
 * 节点属性类型定义
 *
 * 定义了不同层级节点的 props 类型，用于存储布局渲染所需的属性。
 *
 * 分类：
 * - SNMusicProps: 音乐属性（所有层级都可能有的）
 * - SNMetadataProps: 元信息属性（只在 score/section 层级存在）
 * - SNScoreProps: Score 和 Section 的完整属性
 */

import type {
  SNTimeSignature,
  SNKeySignature,
  SNTempo,
} from '@core/model/music';
import type { SNTimeUnit } from '@core/model/ticks';

/**
 * 创作者信息
 *
 * 用于记录乐谱的创作者信息，如作曲、作词、编曲等
 */
export type SNContributor = {
  /** 姓名 */
  name: string;
  /** 角色：作曲/作词/编曲/转录 */
  role: 'composer' | 'lyricist' | 'arranger' | 'transcriber';
  /** 联系方式（可选） */
  contact?: string;
};

/**
 * 音乐属性（所有层级都可能有的，参与布局渲染）
 *
 * score、section、measure 等层级都可能有这些属性。
 *
 * 这些属性会直接影响音乐的布局和渲染：
 * - timeSignature: 决定小节的长度和拍数
 * - keySignature: 决定调号的显示
 * - tempo: 决定速度标记的显示
 * - timeUnit: 用于时间对齐和位置计算
 */
export interface SNMusicProps {
  /** 拍号（如 4/4） */
  timeSignature?: SNTimeSignature;
  /** 调号（如 C大调） */
  keySignature?: SNKeySignature;
  /** 速度（如 120 BPM） */
  tempo?: SNTempo;
  /**
   * 时间单位配置（通用方案）
   *
   * 用于确定最小时间单位，计算音符、休止符、歌词等在时间序列上的位置对齐。
   * 所有时间相关的计算都基于 ticks，确保精确性和性能。
   */
  timeUnit?: SNTimeUnit;
}

/**
 * 元信息属性（只在 score 和 section 层级存在）
 *
 * 参与布局渲染，但不适用于 measure 等更细粒度层级。
 *
 * 这些属性用于显示乐谱的元信息：
 * - title: 乐谱标题
 * - subtitle: 副标题
 * - contributors: 创作者列表
 */
export interface SNMetadataProps {
  /** 标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** 创作者列表（作曲、作词等） */
  contributors?: SNContributor[];
}

/**
 * Score 和 Section 的完整属性
 *
 * 包含音乐属性和元信息属性。
 *
 * 用途：
 * - Score 节点：完整乐谱的属性
 * - Section 节点：乐谱中某个部分的属性
 *
 * 注意：Measure 节点只使用 SNMusicProps，不包含元信息属性。
 */
export type SNScoreProps = SNMusicProps & SNMetadataProps;
