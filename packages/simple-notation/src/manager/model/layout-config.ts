import { SNLayoutMargin, SNLayoutPadding } from '@layout/model';

/**
 * 布局配置
 *
 * 针对布局层的配置，影响布局树的结构和样式。
 * 层级：全局(ROOT) → 页面(PAGE) → 块/行/元素(BLOCK/LINE/ELEMENT)
 *
 * 设计理念：
 * - 所有配置都是用户可感知的（修改后会直接影响渲染效果）
 * - 配置会传递给 LayoutBuilder，用于构建和样式化布局树
 */
export interface SNLayoutConfig {
  /** 全局配置（ROOT 层级） */
  global: SNLayoutGlobalConfig;

  /** 页面配置（PAGE 层级） */
  page: SNLayoutPageConfig;

  /** 块配置（BLOCK 层级） */
  block: SNLayoutBlockConfig;

  /** 行配置（LINE 层级） */
  line: SNLayoutLineConfig;

  /** 元素配置（ELEMENT 层级） */
  element: SNLayoutElementConfig;
}

/**
 * 全局布局配置（ROOT 层级）
 *
 * 控制整个渲染容器的整体样式和布局
 */
export interface SNLayoutGlobalConfig {
  /** 容器尺寸 */
  size: {
    /**
     * 容器宽度
     * - `number`: 固定宽度（像素）
     * - `null`: 自适应父容器（100%）
     */
    width: number | null;
    /**
     * 容器高度
     * - `number`: 固定高度（像素）
     * - `null`: 自适应父容器（100%）
     */
    height: number | null;
    /** 是否自动调整高度（当内容超出时自动增加高度） */
    autoHeight?: boolean;
  };

  /** 容器样式 */
  style: {
    /** 背景色 */
    backgroundColor?: string;
    /** 背景图片（可选） */
    backgroundImage?: string;
    /** 边框样式 */
    border?: {
      width?: number;
      color?: string;
      style?: 'solid' | 'dashed' | 'dotted';
      radius?: number;
    };
    /** 阴影 */
    shadow?: {
      color?: string;
      blur?: number;
      offsetX?: number;
      offsetY?: number;
    };
  };

  /** 全局间距 */
  spacing: {
    /** 内边距 */
    padding?: SNLayoutPadding;
    /** 外边距 */
    margin?: SNLayoutMargin;
  };
}

/**
 * 页面布局配置（PAGE 层级）
 *
 * 控制分页相关的布局和样式（仅在启用分页时生效）
 */
export interface SNLayoutPageConfig {
  /** 是否启用分页 */
  enable: boolean;

  /** 页面尺寸 */
  size: {
    /** 页面宽度（像素） */
    width: number;
    /** 页面高度（像素） */
    height: number;
  };

  /** 页面样式 */
  style: {
    /** 页面背景色 */
    backgroundColor?: string;
    /** 页面边框 */
    border?: {
      width?: number;
      color?: string;
      style?: 'solid' | 'dashed' | 'dotted';
    };
    /** 页面阴影 */
    shadow?: {
      color?: string;
      blur?: number;
      offsetX?: number;
      offsetY?: number;
    };
  };

  /** 页面间距 */
  spacing: {
    /** 页面边距（每页四周的边距） */
    margin: SNLayoutMargin;
    /** 页面内边距（每页内容的边距） */
    padding: SNLayoutPadding;
    /** 页面间距（页与页之间的间距） */
    pageGap?: number;
  };

  /** 页码配置 */
  pageNumber: {
    /** 是否显示页码 */
    enable: boolean;
    /** 页码位置 */
    position: 'top' | 'bottom' | 'header' | 'footer';
    /** 页码样式 */
    style: {
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      fontWeight?: 'normal' | 'bold';
    };
    /** 页码格式（如 "1", "第 1 页", "{page}"） */
    format?: string;
  };
}

/**
 * 块布局配置（BLOCK 层级）
 *
 * 控制块级元素的布局和样式（如乐谱块、标题块等）
 */
export interface SNLayoutBlockConfig {
  /** 块尺寸 */
  size: {
    /** 默认宽度（number 表示固定宽度，null 表示自适应） */
    width?: number | null;
    /** 默认高度（number 表示固定高度，null 表示自适应） */
    height?: number | null;
    /** 最小宽度 */
    minWidth?: number;
    /** 最小高度 */
    minHeight?: number;
    /** 最大宽度 */
    maxWidth?: number;
    /** 最大高度 */
    maxHeight?: number;
  };

  /** 块样式 */
  style: {
    /** 背景色 */
    backgroundColor?: string;
    /** 边框 */
    border?: {
      width?: number;
      color?: string;
      style?: 'solid' | 'dashed' | 'dotted';
      radius?: number;
    };
    /** 阴影 */
    shadow?: {
      color?: string;
      blur?: number;
      offsetX?: number;
      offsetY?: number;
    };
  };

  /** 块间距 */
  spacing: {
    /** 内边距 */
    padding?: SNLayoutPadding;
    /** 外边距 */
    margin?: SNLayoutMargin;
    /** 块与块之间的间距 */
    blockGap?: number;
  };

  /** 布局方向 */
  layout: {
    /** 排列方向 */
    direction?: 'horizontal' | 'vertical';
    /** 对齐方式 */
    align?: 'start' | 'center' | 'end' | 'stretch';
    /** 换行策略 */
    wrap?: 'nowrap' | 'wrap';
  };
}

/**
 * 行布局配置（LINE 层级）
 *
 * 控制行级元素的布局和样式（如乐谱行、歌词行等）
 */
export interface SNLayoutLineConfig {
  /** 行尺寸 */
  size: {
    /** 行高度 */
    height?: number;
    /** 最小高度 */
    minHeight?: number;
    /** 最大高度 */
    maxHeight?: number;
  };

  /** 行样式 */
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

  /** 行间距 */
  spacing: {
    /** 行内边距 */
    padding?: SNLayoutPadding;
    /** 行外边距 */
    margin?: SNLayoutMargin;
    /** 行与行之间的间距 */
    lineGap?: number;
  };

  /** 行布局 */
  layout: {
    /** 行内对齐方式 */
    align?: 'left' | 'center' | 'right' | 'justify';
    /** 垂直对齐 */
    verticalAlign?: 'top' | 'middle' | 'bottom';
  };
}

/**
 * 元素布局配置（ELEMENT 层级）
 *
 * 控制最小元素单元的布局和样式（如单个音符、歌词字等）
 */
export interface SNLayoutElementConfig {
  /** 元素尺寸 */
  size: {
    /** 默认宽度（number 表示固定宽度，null 表示自适应） */
    width?: number | null;
    /** 默认高度（number 表示固定高度，null 表示自适应） */
    height?: number | null;
    /** 最小宽度 */
    minWidth?: number;
    /** 最小高度 */
    minHeight?: number;
  };

  /** 元素样式 */
  style: {
    /** 背景色 */
    backgroundColor?: string;
    /** 边框 */
    border?: {
      width?: number;
      color?: string;
      style?: 'solid' | 'dashed' | 'dotted';
      radius?: number;
    };
  };

  /** 元素间距 */
  spacing: {
    /** 元素内边距 */
    padding?: SNLayoutPadding;
    /** 元素外边距 */
    margin?: SNLayoutMargin;
    /** 元素与元素之间的间距 */
    elementGap?: number;
  };
}
