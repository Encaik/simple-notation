import { SNParserRoot, SNParserScore } from '@data/node';
import {
  SNLayoutRoot,
  SNLayoutPage,
  SNLayoutBlock,
  SNLayoutLine,
  SNLayoutElement,
} from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import type { SNParserNode } from '@data/node';

/**
 * 布局构建器
 *
 * 负责将数据树（SNParserRoot）转换为布局树（SNLayoutRoot）
 *
 * 架构：
 * - 数据层：Root → Score → Section → Voice → Measure → Element
 * - 布局层：ROOT → PAGE → BLOCK/LINE → ELEMENT
 *
 * 设计理念：
 * - 与数据层和渲染层完全隔离
 * - 根据配置进行布局计算
 * - 布局树结构可扩展，便于未来支持不同的布局算法
 */
export class SNLayoutBuilder {
  private layoutTree: SNLayoutRoot;
  private layoutConfig: LayoutConfig;
  private scoreConfig: ScoreConfig;
  private nodeIdCounter = 0;

  /**
   * 创建布局构建器
   *
   * @param dataTree - 数据树（解析后的乐谱数据）
   * @param layoutConfig - 布局配置（可选）
   * @param scoreConfig - 乐谱配置（可选）
   */
  constructor(
    dataTree: SNParserRoot,
    layoutConfig?: LayoutConfig,
    scoreConfig?: ScoreConfig,
  ) {
    this.layoutConfig = layoutConfig || new LayoutConfig();
    this.scoreConfig = scoreConfig || new ScoreConfig();
    this.layoutTree = this.build(dataTree);
  }

  /**
   * 构建布局树
   *
   * @param dataTree - 数据树
   * @returns 布局树根节点
   */
  private build(dataTree: SNParserRoot): SNLayoutRoot {
    const root = new SNLayoutRoot({ id: this.getNextId('root') });
    root.data = dataTree;

    // 获取全局配置和页面配置
    const globalConfig = this.layoutConfig.getGlobal();
    const pageConfig = this.layoutConfig.getPage();

    // 计算实际画布尺寸
    // 如果 global.size 为 null 或 'auto'，需要从容器获取实际大小
    // 这里先设置为 null，在渲染时由渲染器根据容器大小决定
    const canvasWidth =
      globalConfig.size.width === null || globalConfig.size.width === 'auto'
        ? null
        : globalConfig.size.width;
    const canvasHeight =
      globalConfig.size.height === null || globalConfig.size.height === 'auto'
        ? null
        : globalConfig.size.height;

    // 如果未启用分页，页面尺寸应该使用画布尺寸
    // 如果启用分页，页面尺寸使用 page.size
    let effectiveWidth = canvasWidth;
    let effectiveHeight = canvasHeight;

    if (pageConfig.enable) {
      // 启用分页：使用页面尺寸
      effectiveWidth = pageConfig.size.width;
      effectiveHeight = pageConfig.size.height;
    }

    // 设置根节点的布局属性
    root.updateLayout({
      x: 0,
      y: 0,
      width: effectiveWidth,
      height: effectiveHeight,
      padding: globalConfig.spacing.padding || {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      margin: globalConfig.spacing.margin || {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });

    // 根据页面配置决定是否分页（复用之前获取的 pageConfig）
    if (pageConfig.enable) {
      // 分页模式：将每个 Score 放入不同的 Page
      const pages = this.buildPages(
        (dataTree.children || []) as SNParserScore[],
      );
      root.addChildren(pages);
    } else {
      // 非分页模式：直接将 Score 转换为 Block
      const blocks = this.buildBlocks(
        (dataTree.children || []) as SNParserScore[],
      );
      root.addChildren(blocks);
    }

    return root;
  }

  /**
   * 构建页面节点（分页模式）
   *
   * @param scores - Score 节点数组
   * @returns 页面节点数组
   */
  private buildPages(scores: SNParserScore[]): SNLayoutPage[] {
    const pageConfig = this.layoutConfig.getPage();
    const pages: SNLayoutPage[] = [];
    let currentY = 0;

    for (const score of scores) {
      const page = new SNLayoutPage({ id: this.getNextId('page') });
      page.data = score;

      const pageSize = pageConfig.size;
      const pageMargin = pageConfig.spacing.margin;
      const pagePadding = pageConfig.spacing.padding;

      // 设置页面布局
      page.updateLayout({
        x: pageMargin.left,
        y: currentY + pageMargin.top,
        width: pageSize.width - pageMargin.left - pageMargin.right,
        height: pageSize.height - pageMargin.top - pageMargin.bottom,
        padding: pagePadding,
        margin: pageMargin,
      });

      // 将 Score 转换为 Block 并添加到页面
      const blocks = this.buildBlocks([score]);
      page.addChildren(blocks);

      pages.push(page);
      currentY += pageSize.height + (pageConfig.spacing.pageGap || 0);
    }

    return pages;
  }

  /**
   * 构建块节点
   *
   * @param scores - Score 节点数组
   * @returns 块节点数组
   */
  private buildBlocks(scores: SNParserScore[]): SNLayoutBlock[] {
    const blockConfig = this.layoutConfig.getBlock();
    const blocks: SNLayoutBlock[] = [];
    let currentY = 0;

    for (const score of scores) {
      const block = new SNLayoutBlock({ id: this.getNextId('block') });
      block.data = score;

      // 设置块布局（初始位置，后续会根据内容调整）
      block.updateLayout({
        x: 0,
        y: currentY,
        width:
          blockConfig.size.width === 'auto' ? 0 : blockConfig.size.width || 0,
        height:
          blockConfig.size.height === 'auto' ? 0 : blockConfig.size.height || 0,
        padding: blockConfig.spacing.padding,
        margin: blockConfig.spacing.margin,
      });

      // 构建 Section 为 Block 或 Line
      const sectionChildren = this.buildSections(score.children || []);
      block.addChildren(sectionChildren);

      blocks.push(block);
      // 更新 currentY（会在后续布局计算中精确计算）
      currentY += 100; // 临时值，后续会根据实际内容计算
    }

    return blocks;
  }

  /**
   * 构建 Section 的子节点（Block 或 Line）
   *
   * @param sections - Section 节点数组（需要类型断言）
   * @returns 布局节点数组（Block 或 Line）
   */
  private buildSections(
    sections: SNParserNode[],
  ): Array<SNLayoutBlock | SNLayoutLine> {
    const sectionConfig = this.scoreConfig.getSection();
    const children: Array<SNLayoutBlock | SNLayoutLine> = [];
    let currentY = 0;

    for (const section of sections) {
      // 类型检查：确保是 Section
      if (section.type !== 'section') continue;

      // Section 可以作为 Block 或直接展开为 Line
      // 这里将 Section 展开为 Block，包含多个 Voice
      const sectionBlock = new SNLayoutBlock({ id: this.getNextId('block') });
      sectionBlock.data = section;

      sectionBlock.updateLayout({
        x: 0,
        y: currentY,
        width: 0, // 自适应
        height: 0, // 自适应
        margin: {
          top: 0,
          right: 0,
          bottom: sectionConfig.spacing.sectionGap || 0,
          left: 0,
        },
      });

      // 构建 Voice 为 Line
      const voiceLines = this.buildVoices(section.children || []);
      sectionBlock.addChildren(voiceLines);

      children.push(sectionBlock);
      currentY += 100; // 临时值
    }

    return children;
  }

  /**
   * 构建 Voice 为 Line 节点
   *
   * @param voices - Voice 节点数组（需要类型断言）
   * @returns Line 节点数组
   */
  private buildVoices(voices: SNParserNode[]): SNLayoutLine[] {
    const lineConfig = this.layoutConfig.getLine();
    const voiceConfig = this.scoreConfig.getVoice();
    const lines: SNLayoutLine[] = [];
    let currentY = 0;

    for (const voice of voices) {
      // 类型检查：确保是 Voice
      if (voice.type !== 'voice') continue;

      const line = new SNLayoutLine({ id: this.getNextId('line') });
      line.data = voice;

      const lineHeight = lineConfig.size.height || 50;
      const voiceGap = voiceConfig.spacing.voiceGap || 20;

      line.updateLayout({
        x: 0,
        y: currentY,
        width: 0, // 自适应
        height: lineHeight,
        padding: lineConfig.spacing.padding,
        margin: { top: 0, right: 0, bottom: voiceGap, left: 0 },
      });

      // 构建 Measure 为元素
      const measureElements = this.buildMeasures(voice.children || []);
      line.addChildren(measureElements);

      lines.push(line);
      currentY += lineHeight + voiceGap;
    }

    return lines;
  }

  /**
   * 构建 Measure 为 Element 节点
   *
   * @param measures - Measure 节点数组（需要类型断言）
   * @returns Element 节点数组
   */
  private buildMeasures(measures: SNParserNode[]): SNLayoutElement[] {
    const measureConfig = this.scoreConfig.getMeasure();
    const elements: SNLayoutElement[] = [];
    let currentX = 0;

    for (const measure of measures) {
      // 类型检查：确保是 Measure
      if (measure.type !== 'measure') continue;

      const element = new SNLayoutElement({ id: this.getNextId('element') });
      element.data = measure;

      const measureGap = measureConfig.spacing.measureGap || 10;

      // Measure 元素的宽度需要根据内容计算，这里先给一个初始值
      const measureWidth = 100; // 临时值，后续会根据实际音符宽度计算

      element.updateLayout({
        x: currentX,
        y: 0,
        width: measureWidth,
        height: 0, // 自适应行高
        margin: { top: 0, right: measureGap, bottom: 0, left: 0 },
      });

      // 构建 Measure 内部的元素（Note/Rest/Lyric 等）
      const innerElements = this.buildMeasureElements(measure.children || []);
      element.addChildren(innerElements);

      elements.push(element);
      currentX += measureWidth + measureGap;
    }

    return elements;
  }

  /**
   * 构建 Measure 内部的元素
   *
   * @param elements - Measure 的子元素（Note/Rest/Lyric/Tuplet）
   * @returns Element 节点数组
   */
  private buildMeasureElements(elements: SNParserNode[]): SNLayoutElement[] {
    const elementConfig = this.layoutConfig.getElement();
    const layoutElements: SNLayoutElement[] = [];
    let currentX = 0;

    for (const dataElement of elements) {
      const layoutElement = new SNLayoutElement({
        id: this.getNextId('element'),
      });
      layoutElement.data = dataElement;

      const elementGap = elementConfig.spacing.elementGap || 5;

      // 根据元素类型设置不同的宽度
      let elementWidth = 20; // 默认宽度
      if (dataElement.type === 'note') {
        elementWidth = 30;
      } else if (dataElement.type === 'rest') {
        elementWidth = 25;
      } else if (dataElement.type === 'lyric') {
        elementWidth = 40;
      } else if (dataElement.type === 'tuplet') {
        elementWidth = 50; // 连音可能包含多个音符
      }

      layoutElement.updateLayout({
        x: currentX,
        y: 0,
        width: elementWidth,
        height: 0, // 自适应
      });

      layoutElements.push(layoutElement);
      currentX += elementWidth + elementGap;
    }

    return layoutElements;
  }

  /**
   * 获取下一个节点 ID
   *
   * @param prefix - ID 前缀
   * @returns 节点 ID
   */
  private getNextId(prefix: string): string {
    return `${prefix}-${++this.nodeIdCounter}`;
  }

  /**
   * 获取布局树
   *
   * @returns 布局树根节点
   */
  getLayoutTree(): SNLayoutRoot {
    return this.layoutTree;
  }
}
