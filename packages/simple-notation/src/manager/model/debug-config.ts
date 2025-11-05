/**
 * 调试配置（渲染层）
 *
 * 控制调试用的可视化辅助，例如背景框绘制等
 */
export interface SNDebugConfig {
  /** 是否启用渲染层背景框（调试用） */
  enableBackgroundBoxes: boolean;
  /** 各层级开关（可选，未指定则继承 enableBackgroundBoxes） */
  layers?: {
    root?: boolean;
    page?: boolean;
    block?: boolean;
    line?: boolean;
    element?: boolean;
  };
}
