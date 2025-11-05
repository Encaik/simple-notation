import { SNParserRoot, SNParserScore, type SNParserNode } from '@data/node';
import {
  SNLayoutRoot,
  SNLayoutPage,
  SNLayoutBlock,
  SNLayoutLine,
  SNLayoutElement,
  type SNLayoutNode,
} from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import {
  RootTransformer,
  ScoreTransformer,
  SectionTransformer,
  VoiceTransformer,
  MeasureTransformer,
  PageTransformer,
} from './trans';

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
 * - 使用转换器（transformer）将数据层节点转换为布局层节点，每个转换器独立不耦合
 *
 * 构建策略：
 * - 采用自底向上的方式构建布局树，从叶子节点开始
 * - 在构建每个节点时，立即计算其布局信息（宽高、位置）
 * - 这样确保父节点在构建时，子节点的尺寸已经确定，可以准确计算父节点的尺寸
 */
export class SNLayoutBuilder {
  private layoutTree: SNLayoutRoot;
  private layoutConfig: LayoutConfig;
  private scoreConfig: ScoreConfig;

  // 转换器
  private rootTransformer: RootTransformer;
  private scoreTransformer: ScoreTransformer;
  private sectionTransformer: SectionTransformer;
  private voiceTransformer: VoiceTransformer;
  private measureTransformer: MeasureTransformer;
  private pageTransformer: PageTransformer;

  /**
   * 创建布局构建器
   *
   * @param dataTree - 数据树（解析后的乐谱数据）
   * @param layoutConfig - 布局配置（可选）
   * @param scoreConfig - 乐谱配置（可选）
   * @param containerSize - 容器尺寸（可选，用于计算页面大小）
   */
  constructor(
    dataTree: SNParserRoot,
    layoutConfig?: LayoutConfig,
    scoreConfig?: ScoreConfig,
    containerSize?: { width: number; height: number },
  ) {
    // 初始化配置对象
    this.layoutConfig = layoutConfig || new LayoutConfig();
    this.scoreConfig = scoreConfig || new ScoreConfig();

    // 初始化转换器
    this.rootTransformer = new RootTransformer(this.layoutConfig);
    this.scoreTransformer = new ScoreTransformer(this.layoutConfig);
    this.sectionTransformer = new SectionTransformer(this.scoreConfig);
    this.voiceTransformer = new VoiceTransformer(
      this.layoutConfig,
      this.scoreConfig,
    );
    this.measureTransformer = new MeasureTransformer(this.scoreConfig);
    this.pageTransformer = new PageTransformer(this.layoutConfig);

    // 构建布局树（自底向上构建，并在构建时计算布局信息）
    this.layoutTree = this.build(dataTree, containerSize);
  }

  /**
   * 构建布局树（自底向上构建）
   *
   * 从叶子节点开始构建，确保在构建父节点时，子节点的尺寸已经确定
   *
   * @param dataTree - 数据树
   * @param containerSize - 容器尺寸（可选）
   * @returns 布局树根节点
   */
  private build(
    dataTree: SNParserRoot,
    containerSize?: { width: number; height: number },
  ): SNLayoutRoot {
    // 先创建 Root 节点（不设置子节点）
    const root = this.rootTransformer.transform(dataTree, containerSize);

    // 获取页面配置
    const pageConfig = this.layoutConfig.getPage();

    // 根据页面配置决定是否分页，自底向上构建子节点
    if (pageConfig.enable) {
      // 分页模式：将每个 Score 放入不同的 Page
      this.buildPages((dataTree.children || []) as SNParserScore[], root);
    } else {
      // 非分页模式：直接将 Score 转换为 Block
      this.buildScores((dataTree.children || []) as SNParserScore[], root);
    }

    // 所有子节点构建完成后，计算 Root 的布局信息
    this.finalizeNodeLayout(root);

    return root;
  }

  /**
   * 构建页面节点（分页模式）
   *
   * 自底向上构建：先构建子节点，再计算当前节点的布局
   *
   * @param scores - Score 节点数组
   * @param parentNode - 父节点
   */
  private buildPages(scores: SNParserScore[], parentNode: SNLayoutRoot): void {
    for (const score of scores) {
      // 使用 PageTransformer 转换 Score 为 Page
      const page = this.pageTransformer.transform(score, parentNode);

      // 构建 Score 节点（在 Page 内部）
      this.buildScores([score], page);

      // 子节点构建完成后，计算 Page 的布局信息
      this.finalizeNodeLayout(page);
    }
  }

  /**
   * 构建 Score 节点
   *
   * 自底向上构建：先计算当前节点的宽度，再构建子节点，最后计算高度和位置
   *
   * @param scores - Score 节点数组
   * @param parentNode - 父节点（Root 或 Page）
   */
  private buildScores(
    scores: SNParserScore[],
    parentNode: SNLayoutRoot | SNLayoutPage,
  ): void {
    for (const score of scores) {
      // 使用 ScoreTransformer 转换 Score 为 Block
      const scoreBlock = this.scoreTransformer.transform(score, parentNode);

      // 先计算 Block 的宽度（这样子节点 Section Block 可以获取父节点宽度）
      this.calculateNodeWidth(scoreBlock);

      // 构建 Section 节点
      this.buildSections((score.children || []) as SNParserNode[], scoreBlock);

      // 子节点构建完成后，计算 Score Block 的高度和位置
      this.calculateNodeHeight(scoreBlock);
      this.calculateNodePosition(scoreBlock);
    }
  }

  /**
   * 构建 Section 节点
   *
   * 自底向上构建：先计算当前节点的宽度，再构建子节点，最后计算高度和位置
   *
   * @param sections - Section 节点数组
   * @param parentNode - 父节点（Block）
   */
  private buildSections(
    sections: SNParserNode[],
    parentNode: SNLayoutBlock,
  ): void {
    for (const section of sections) {
      // 使用 SectionTransformer 转换 Section 为 Block
      const sectionBlock = this.sectionTransformer.transform(
        section,
        parentNode,
      );

      if (!sectionBlock) continue;

      // 先计算 Block 的宽度（这样子节点 Line 可以获取父节点宽度）
      this.calculateNodeWidth(sectionBlock);

      // 构建 Voice 节点
      this.buildVoices(
        (section.children || []) as SNParserNode[],
        sectionBlock,
      );

      // 子节点构建完成后，计算 Section Block 的高度和位置
      this.calculateNodeHeight(sectionBlock);
      this.calculateNodePosition(sectionBlock);
    }
  }

  /**
   * 构建 Voice 节点
   *
   * 自底向上构建：先计算当前节点的宽度，再构建子节点，最后计算高度和位置
   * Line 的宽度应该立即计算，因为它是撑满父级的
   *
   * @param voices - Voice 节点数组
   * @param parentNode - 父节点（Block）
   */
  private buildVoices(voices: SNParserNode[], parentNode: SNLayoutBlock): void {
    for (const voice of voices) {
      // 使用 VoiceTransformer 转换 Voice 为 Line
      const line = this.voiceTransformer.transform(voice, parentNode);

      if (!line) continue;

      // Line 一旦创建，宽度应该立即撑满父级（Block 的宽度已经在前面的步骤中计算好了）
      this.calculateNodeWidth(line);

      // 构建 Measure 节点
      this.buildMeasures((voice.children || []) as SNParserNode[], line);

      // 子节点构建完成后，计算 Line 的高度和位置
      // Line 的高度已经在转换器中设置，只需要计算位置
      this.calculateNodePosition(line);
    }
  }

  /**
   * 构建 Measure 节点
   *
   * 自底向上构建：先构建子节点，再计算当前节点的布局
   *
   * @param measures - Measure 节点数组
   * @param parentNode - 父节点（Line）
   */
  private buildMeasures(
    measures: SNParserNode[],
    parentNode: SNLayoutLine,
  ): void {
    for (const measure of measures) {
      // 使用 MeasureTransformer 转换 Measure 为 Element
      const element = this.measureTransformer.transform(measure, parentNode);

      if (!element) continue;

      // 构建 Measure 内部的元素（Note/Rest/Lyric等）
      this.buildMeasureElements(
        (measure.children || []) as SNParserNode[],
        element,
      );

      // 子节点构建完成后，计算 Element 的布局信息
      this.finalizeNodeLayout(element);
    }
  }

  /**
   * 构建 Measure 内部的元素（叶子节点）
   *
   * 这些是最底层的元素，有固定的宽高，不需要计算
   *
   * @param elements - Measure 的子元素（Note/Rest/Lyric/Tuplet）
   * @param parentNode - 父节点（Element）
   */
  private buildMeasureElements(
    elements: SNParserNode[],
    parentNode: SNLayoutElement,
  ): void {
    for (const dataElement of elements) {
      // 使用 MeasureTransformer 转换元素
      const layoutElement = this.measureTransformer.transformElement(
        dataElement,
        parentNode,
      );

      if (!layoutElement) continue;

      // 叶子节点：直接计算位置（宽高已在转换器中设置）
      this.calculateNodePosition(layoutElement);
    }
  }

  /**
   * 完成节点的布局计算
   *
   * 在自底向上构建过程中，当子节点都构建完成后，调用此方法计算当前节点的布局信息
   * 包括：宽度、高度和位置
   *
   * @param node - 当前节点
   */
  private finalizeNodeLayout(node: SNLayoutNode): void {
    if (!node.layout) return;

    // 1. 计算宽度
    this.calculateNodeWidth(node);

    // 2. 计算高度
    this.calculateNodeHeight(node);

    // 3. 计算位置
    this.calculateNodePosition(node);
  }

  /**
   * 计算节点的宽度
   *
   * @param node - 当前节点
   */
  private calculateNodeWidth(node: SNLayoutNode): void {
    if (!node.layout) return;

    if (node instanceof SNLayoutRoot) {
      // Root节点的宽度在渲染时由渲染器根据SVG实际宽度设置
      // 这里先设置为0，表示自适应
      if (
        node.layout.width === null ||
        node.layout.width === 'auto' ||
        typeof node.layout.width !== 'number'
      ) {
        node.layout.width = 0;
      }
    } else if (node instanceof SNLayoutPage) {
      // Page宽度已在构建时设置，确保是数值类型
      if (
        node.layout.width === null ||
        node.layout.width === 'auto' ||
        typeof node.layout.width !== 'number'
      ) {
        node.layout.width = 0;
      }
    } else if (node instanceof SNLayoutBlock || node instanceof SNLayoutLine) {
      // Block和Line：撑满父级宽度
      node.calculateWidth();
    } else if (node instanceof SNLayoutElement) {
      // Element：根据子节点计算宽度
      if (node.children && node.children.length > 0) {
        const childrenMaxWidth = node.calculateChildrenMaxWidth();
        const padding = node.layout.padding || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };
        node.layout.width =
          childrenMaxWidth > 0
            ? childrenMaxWidth + padding.left + padding.right
            : 20;
      } else {
        // 叶子元素：使用已有宽度或默认值
        if (
          !node.layout.width ||
          typeof node.layout.width !== 'number' ||
          node.layout.width === 0
        ) {
          node.layout.width = 20;
        }
      }
    }
  }

  /**
   * 计算节点的高度
   *
   * @param node - 当前节点
   */
  private calculateNodeHeight(node: SNLayoutNode): void {
    if (!node.layout) return;

    if (node instanceof SNLayoutRoot || node instanceof SNLayoutBlock) {
      // Root和Block：根据子节点内容撑开高度
      node.calculateHeight();
    } else if (node instanceof SNLayoutPage) {
      // Page：根据子节点内容撑开高度
      const childrenHeight = node.calculateChildrenHeight();
      const padding = node.layout.padding || {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
      // childrenHeight 返回的是 maxBottom，已经包含了 padding.top 的空间
      // 所以只需要加上 padding.bottom 即可
      node.layout.height = childrenHeight + padding.bottom;
    } else if (node instanceof SNLayoutLine) {
      // Line节点高度按配置设置，不需要计算（已在转换器中设置）
      // 这里不做处理
    } else if (node instanceof SNLayoutElement) {
      // Element：根据子节点计算高度，如果没有子节点则使用默认值
      if (node.children && node.children.length > 0) {
        const childrenHeight = node.calculateChildrenHeight();
        const padding = node.layout.padding || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };
        // childrenHeight 返回的是 maxBottom，已经包含了 padding.top 的空间
        // 所以只需要加上 padding.bottom 即可
        node.layout.height = childrenHeight + padding.bottom;
      } else {
        // 叶子元素：使用已有高度或默认值
        if (
          !node.layout.height ||
          typeof node.layout.height !== 'number' ||
          node.layout.height === 0
        ) {
          node.layout.height = 20;
        }
      }
    }
  }

  /**
   * 计算节点的位置（x, y坐标）
   *
   * 父子之间的xy都是相对的，即子节点的xy是基于父节点xy计算的
   * 子节点的layout.x和layout.y是相对于父节点的，渲染时需要加上父节点的实际坐标
   *
   * @param node - 当前节点
   */
  private calculateNodePosition(node: SNLayoutNode): void {
    if (!node.layout) return;

    // 根节点位置固定为(0, 0)
    if (!node.parent) {
      node.layout.x = 0;
      node.layout.y = 0;
      return;
    }

    const parentLayout = node.parent.layout;
    if (!parentLayout) return;

    const parentPadding = node.getParentPadding();

    // 计算X坐标
    // 对于垂直排列的节点（Block, Line），X = 父节点的padding.left
    // 对于水平排列的节点（Element），X = 父节点的padding.left + 前面兄弟节点的累积宽度
    if (node instanceof SNLayoutElement) {
      // Element节点：水平排列，需要累加前面兄弟节点的宽度
      let x = parentPadding.left;

      const siblingIndex = node.parent.children?.indexOf(node) ?? -1;
      if (siblingIndex > 0 && node.parent.children) {
        for (let i = 0; i < siblingIndex; i++) {
          const sibling = node.parent.children[i];
          if (sibling.layout) {
            const siblingWidth =
              typeof sibling.layout.width === 'number'
                ? sibling.layout.width
                : 0;
            const siblingMargin = sibling.layout.margin || {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            };
            // 累加兄弟节点的宽度和右边margin
            x += siblingWidth + siblingMargin.right;
          }
        }
      }
      node.layout.x = x;
    } else {
      // Block和Line节点：垂直排列，X = 父节点的padding.left
      node.layout.x = parentPadding.left;
    }

    // 计算Y坐标
    // 对于垂直排列的节点（Block, Line），Y = 父节点的padding.top + 前面兄弟节点的累积高度
    // 对于水平排列的节点（Element），Y = 父节点的padding.top
    if (node instanceof SNLayoutElement) {
      // Element节点：水平排列，Y = 父节点的padding.top
      node.layout.y = parentPadding.top;
    } else {
      // Block和Line节点：垂直排列，需要累加前面兄弟节点的高度
      let y = parentPadding.top;

      const siblingIndex = node.parent.children?.indexOf(node) ?? -1;
      if (siblingIndex > 0 && node.parent.children) {
        for (let i = 0; i < siblingIndex; i++) {
          const sibling = node.parent.children[i];
          if (sibling.layout) {
            const siblingHeight =
              typeof sibling.layout.height === 'number'
                ? sibling.layout.height
                : 0;
            const siblingMargin = sibling.layout.margin || {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            };
            // 累加兄弟节点的高度和底部margin
            y += siblingHeight + siblingMargin.bottom;
          }
        }
      }
      node.layout.y = y;
    }
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
