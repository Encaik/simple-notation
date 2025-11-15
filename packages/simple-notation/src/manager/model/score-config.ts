/**
 * 乐谱配置
 *
 * 针对数据层的配置，影响乐谱数据的解析、处理和显示。
 * 层级：根(ROOT) → 乐谱(Score) → 章节(Section) → 声部(Voice) → 小节(Measure) → 元素(Note/Rest/Lyric等)
 *
 * 设计理念：
 * - 所有配置都是用户可感知的（修改后会直接影响渲染效果）
 * - 配置会影响数据层的行为和样式，进而影响布局和渲染
 */
export interface SNScoreConfig {
  /** 根配置（ROOT 层级） */
  root: SNScoreRootConfig;

  /** 乐谱配置（Score 层级） */
  score: SNScoreScoreConfig;

  /** 章节配置（Section 层级） */
  section: SNScoreSectionConfig;

  /** 声部配置（Voice 层级） */
  voice: SNScoreVoiceConfig;

  /** 小节配置（Measure 层级） */
  measure: SNScoreMeasureConfig;

  /** 元素配置（Note/Rest/Lyric 等元素层级） */
  element: SNScoreElementConfig;
}

/**
 * 根配置（ROOT 层级）
 *
 * 控制整个乐谱文档的全局设置
 */
export interface SNScoreRootConfig {
  /** 元数据设置 */
  metadata: {
    /** 是否显示标题 */
    showTitle?: boolean;
    /** 是否显示副标题 */
    showSubtitle?: boolean;
    /** 是否显示创作者信息 */
    showContributors?: boolean;
  };

  /** 文档样式 */
  style: {
    /** 字体设置 */
    font?: {
      family?: string;
      size?: number;
      color?: string;
      weight?: 'normal' | 'bold';
    };
  };
}

/**
 * 乐谱配置（Score 层级）
 *
 * 控制整个乐谱的显示和样式
 */
export interface SNScoreScoreConfig {
  /** 乐谱类型 */
  scoreType?: SNScoreType;

  /** 乐谱样式 */
  style: {
    /** 背景色 */
    backgroundColor?: string;
    /** 字体设置 */
    font?: {
      family?: string;
      size?: number;
      color?: string;
      weight?: 'normal' | 'bold';
    };
  };

  /** 间距设置 */
  spacing: {
    /** 乐谱内边距 */
    padding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  };
}

/**
 * 章节配置（Section 层级）
 *
 * 控制章节的显示和样式
 */
export interface SNScoreSectionConfig {
  /** 章节样式 */
  style: {
    /** 背景色 */
    backgroundColor?: string;
    /** 分隔线 */
    separator?: {
      enable?: boolean;
      style?: 'solid' | 'dashed' | 'dotted';
      color?: string;
      width?: number;
    };
  };

  /** 间距设置 */
  spacing: {
    /** 章节内边距 */
    padding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    /** 章节与章节之间的间距 */
    sectionGap?: number;
  };
}

/**
 * 声部配置（Voice 层级）
 *
 * 控制声部的显示和样式（多声部乐谱）
 */
export interface SNScoreVoiceConfig {
  /** 声部显示 */
  display: {
    /** 是否显示声部名称 */
    showName?: boolean;
    /** 声部名称样式 */
    nameStyle?: {
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      position?: 'left' | 'top';
    };
  };

  /** 声部样式 */
  style: {
    /** 背景色 */
    backgroundColor?: string;
    /** 边框 */
    border?: {
      width?: number;
      color?: string;
      style?: 'solid' | 'dashed' | 'dotted';
    };
  };

  /** 间距设置 */
  spacing: {
    /** 声部内边距 */
    padding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    /** 声部与声部之间的间距 */
    voiceGap?: number;
  };
}

/**
 * 小节配置（Measure 层级）
 *
 * 控制小节的显示和样式
 */
export interface SNScoreMeasureConfig {
  /** 小节线样式 */
  barline: {
    /** 样式类型 */
    style?: 'single' | 'double' | 'dashed' | 'dotted';
    /** 颜色 */
    color?: string;
    /** 宽度（像素） */
    width?: number;
    /** 是否显示小节线 */
    enable?: boolean;
  };

  /** 小节样式 */
  style: {
    /** 背景色 */
    backgroundColor?: string;
    /** 边框 */
    border?: {
      width?: number;
      color?: string;
      style?: 'solid' | 'dashed' | 'dotted';
    };
  };

  /** 间距设置 */
  spacing: {
    /** 小节内边距 */
    padding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    /** 小节与小节之间的间距 */
    measureGap?: number;
  };

  /** 小节号显示 */
  measureNumber: {
    /** 是否显示小节号 */
    enable?: boolean;
    /** 显示频率（每几小节显示一次） */
    frequency?: number;
    /** 样式 */
    style?: {
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      position?: 'top' | 'bottom' | 'left' | 'right' | 'left-top' | 'right-top';
    };
  };
}

/**
 * 元素配置（Note/Rest/Lyric 等元素层级）
 *
 * 控制乐谱元素的显示和样式
 */
export interface SNScoreElementConfig {
  /** 音符配置 */
  note: SNScoreNoteConfig;

  /** 休止符配置 */
  rest: SNScoreRestConfig;

  /** 歌词配置 */
  lyric: SNScoreLyricConfig;

  /** 和弦配置 */
  chord: SNScoreChordConfig;

  /** 连音线配置 */
  tie: SNScoreTieConfig;

  /** 连音配置 */
  tuplet: SNScoreTupletConfig;
}

/**
 * 音符配置
 */
export interface SNScoreNoteConfig {
  /** 音符样式 */
  style: {
    /** 音符大小（相对于默认大小，1.0 为默认） */
    size?: number;
    /** 音符颜色 */
    color?: string;
    /** 音符填充色 */
    fillColor?: string;
    /** 音符描边 */
    stroke?: {
      width?: number;
      color?: string;
    };
  };

  /** 音符显示 */
  display: {
    /** 是否显示音符名称 */
    showNoteName?: boolean;
    /** 音符名称样式 */
    noteNameStyle?: {
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      position?: 'above' | 'below' | 'inside';
    };
    /** 是否显示时值标记 */
    showDuration?: boolean;
  };

  /** 附点样式 */
  dot: {
    /** 颜色 */
    color?: string;
    /** 大小 */
    size?: number;
  };
}

/**
 * 休止符配置
 */
export interface SNScoreRestConfig {
  /** 休止符样式 */
  style: {
    /** 休止符大小 */
    size?: number;
    /** 颜色 */
    color?: string;
    /** 描边 */
    stroke?: {
      width?: number;
      color?: string;
    };
  };
}

/**
 * 歌词配置
 */
export interface SNScoreLyricConfig {
  /** 歌词显示 */
  display: {
    /** 是否显示歌词 */
    enable?: boolean;
    /** 歌词对齐方式 */
    align?: 'center' | 'left' | 'right' | 'justify';
  };

  /** 歌词样式 */
  style: {
    /** 字体大小 */
    fontSize?: number;
    /** 字体家族 */
    fontFamily?: string;
    /** 字体颜色 */
    color?: string;
    /** 字体粗细 */
    fontWeight?: 'normal' | 'bold';
    /** 行高 */
    lineHeight?: number;
  };

  /** 歌词间距 */
  spacing: {
    /** 与音符的间距 */
    noteGap?: number;
    /** 字与字之间的间距 */
    characterGap?: number;
  };
}

/**
 * 和弦配置
 */
export interface SNScoreChordConfig {
  /** 和弦类型 */
  chordType?: SNChordType;

  /** 和弦显示 */
  display: {
    /** 是否显示和弦 */
    enable?: boolean;
    /** 显示位置 */
    position?: 'above' | 'below' | 'inside';
  };

  /** 和弦样式 */
  style: {
    /** 字体大小 */
    fontSize?: number;
    /** 字体家族 */
    fontFamily?: string;
    /** 字体颜色 */
    color?: string;
    /** 背景色 */
    backgroundColor?: string;
    /** 边框 */
    border?: {
      width?: number;
      color?: string;
      radius?: number;
    };
  };

  /** 吉他指法图配置 */
  fingering?: {
    /** 是否显示指法图 */
    enable?: boolean;
    /** 指法图样式 */
    style?: {
      size?: number;
      color?: string;
    };
  };
}

/**
 * 连音线配置
 */
export interface SNScoreTieConfig {
  /** 连音线样式 */
  style: {
    /** 线条样式 */
    type?: 'slur' | 'tie' | 'phrase';
    /** 颜色 */
    color?: string;
    /** 宽度 */
    width?: number;
    /** 弧度 */
    curvature?: number;
  };
}

/**
 * 连音配置（三连音等）
 */
export interface SNScoreTupletConfig {
  /** 连音显示 */
  display: {
    /** 是否显示连音标记 */
    enable?: boolean;
    /** 标记位置 */
    position?: 'above' | 'below';
  };

  /** 连音样式 */
  style: {
    /** 标记字体大小 */
    fontSize?: number;
    /** 标记颜色 */
    color?: string;
    /** 括号样式 */
    bracket?: {
      enable?: boolean;
      style?: 'square' | 'round';
      color?: string;
      width?: number;
    };
  };
}

/**
 * 乐谱显示类型
 */
export enum SNScoreType {
  /** 简谱 */
  Simple = 'simple',
  /** 吉他谱 */
  Guitar = 'guitar',
  /** 简谱+吉他谱 */
  SimpleGuitar = 'simple-guitar',
}

/**
 * 和弦显示类型
 */
export enum SNChordType {
  /** 默认显示（文本） */
  Default = 'default',
  /** 吉他指法图 */
  Guitar = 'guitar',
}
