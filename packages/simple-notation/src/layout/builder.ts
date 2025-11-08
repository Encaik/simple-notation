import {
  SNParserRoot,
  SNParserScore,
  SNParserLyric,
  type SNParserNode,
} from '@data/node';
import {
  SNLayoutRoot,
  SNLayoutPage,
  SNLayoutBlock,
  SNLayoutLine,
  SNLayoutElement,
  type SNLayoutNode,
} from '@layout/node';
import { SNLayoutNodeType } from '@layout/model';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import { getTimeUnitFromNode, measureDuration } from '@core/utils/time-unit';
import {
  transformRoot,
  transformScore,
  transformSection,
  transformVoiceGroup,
  transformVoiceLine,
  transformMeasure,
  transformMeasureElement,
  transformPage,
} from './trans';

/**
 * 布局构建器
 *
 * 负责将数据树（SNParserRoot）转换为布局树（SNLayoutRoot）
 *
 * 架构：
 * - 数据层：Root → Score → Section → Voice → Measure → Element
 * - 布局层：ROOT → PAGE → BLOCK/LINE → ELEMENT
 */
export class SNLayoutBuilder {
  private layoutTree: SNLayoutRoot;
  private layoutConfig: LayoutConfig;
  private scoreConfig: ScoreConfig;

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

    // 构建布局树
    this.layoutTree = this.build(dataTree, containerSize);
  }

  /**
   * 构建布局树（自底向上构建）
   * @param dataTree - 数据树
   * @param containerSize - 容器尺寸（可选）
   * @returns 布局树根节点
   */
  private build(
    dataTree: SNParserRoot,
    containerSize?: { width: number; height: number },
  ): SNLayoutRoot {
    // 先创建 Root 节点（不设置子节点）
    const root = transformRoot(dataTree, this.layoutConfig, containerSize);

    // 获取页面配置
    const pageConfig = this.layoutConfig.getPage();

    // 根据页面配置决定是否分页，自底向上构建子节点
    if (pageConfig.enable) {
      this.buildPages(dataTree.children || [], root);
    } else {
      this.buildScores(dataTree.children || [], root);
    }

    // 所有子节点构建完成后，计算 Root 的布局信息
    this.finalizeNodeLayout(root);

    return root;
  }

  /**
   * 构建页面节点（分页模式）
   * @param scores - Score 节点数组
   * @param parentNode - 父节点
   */
  private buildPages(scores: SNParserScore[], parentNode: SNLayoutRoot): void {
    for (const score of scores) {
      // 使用 transformPage 转换 Score 为 Page
      const page = transformPage(score, this.layoutConfig, parentNode);

      // 构建 Score 节点（在 Page 内部）
      this.buildScores([score], page);

      // 子节点构建完成后，计算 Page 的布局信息
      this.finalizeNodeLayout(page);
    }
  }

  /**
   * 构建 Score 节点
   * @param scores - Score 节点数组
   * @param parentNode - 父节点（Root 或 Page）
   */
  private buildScores(
    scores: SNParserScore[],
    parentNode: SNLayoutRoot | SNLayoutPage,
  ): void {
    for (const score of scores) {
      // 使用 transformScore 转换 Score 为 Block
      const scoreBlock = transformScore(score, this.layoutConfig, parentNode);

      // 先计算 Block 的宽度（这样子节点 Section Block 可以获取父节点宽度）
      this.calculateNodeWidth(scoreBlock);

      // 计算所有子节点（包括元信息行）的宽度和高度
      if (scoreBlock.children) {
        for (const child of scoreBlock.children) {
          this.calculateNodeWidth(child);
          this.calculateNodeHeight(child);
        }
      }

      // 构建 Section 节点
      this.buildSections(score.children || [], scoreBlock);

      // 子节点构建完成后，计算 Score Block 的高度和位置
      this.calculateNodeHeight(scoreBlock);
      this.calculateNodePosition(scoreBlock);

      // 计算所有子节点（包括元信息行和Section）的位置
      if (scoreBlock.children) {
        for (const child of scoreBlock.children) {
          // 先确保子节点的宽度和高度已计算
          this.calculateNodeWidth(child);
          this.calculateNodeHeight(child);
          // 计算子节点的位置
          this.calculateNodePosition(child);
          // 如果子节点是Line，需要递归计算其子节点（Element）的位置
          if (child.children) {
            for (const grandChild of child.children) {
              this.calculateNodeWidth(grandChild);
              this.calculateNodeHeight(grandChild);
              this.calculateNodePosition(grandChild);
            }
          }
        }
      }
    }
  }

  /**
   * 构建 Section 节点
   * @param sections - Section 节点数组
   * @param parentNode - 父节点（Block）
   */
  private buildSections(
    sections: SNParserNode[],
    parentNode: SNLayoutBlock,
  ): void {
    for (const section of sections) {
      // 使用 transformSection 转换 Section 为 Block
      const sectionBlock = transformSection(
        section,
        this.scoreConfig,
        parentNode,
      );

      if (!sectionBlock) continue;

      // 先计算 Block 的宽度（这样子节点 VoiceGroup 可以获取父节点宽度）
      this.calculateNodeWidth(sectionBlock);

      // 计算所有子节点（包括元信息行）的宽度和高度
      if (sectionBlock.children) {
        for (const child of sectionBlock.children) {
          this.calculateNodeWidth(child);
          this.calculateNodeHeight(child);
        }
      }

      // 构建 VoiceGroup（包含所有 Voice，并处理分行逻辑）
      this.buildVoiceGroups(
        (section.children || []) as SNParserNode[],
        sectionBlock,
      );

      // 子节点构建完成后，计算 Section Block 的高度和位置
      this.calculateNodeHeight(sectionBlock);
      this.calculateNodePosition(sectionBlock);

      // 计算所有子节点（包括元信息行和VoiceGroup）的位置
      if (sectionBlock.children) {
        for (const child of sectionBlock.children) {
          // 先确保子节点的宽度和高度已计算
          this.calculateNodeWidth(child);
          this.calculateNodeHeight(child);
          // 计算子节点的位置
          this.calculateNodePosition(child);
          // 如果子节点是Line，需要递归计算其子节点（Element）的位置
          if (child.children) {
            for (const grandChild of child.children) {
              this.calculateNodeWidth(grandChild);
              this.calculateNodeHeight(grandChild);
              this.calculateNodePosition(grandChild);
            }
          }
        }
      }
    }
  }

  /**
   * 构建 VoiceGroup 节点
   *
   * 将同一 Section 的所有 Voice 组织成一个 VoiceGroup，实现小节对齐和同步换行
   * @param voices - Voice 节点数组
   * @param parentNode - 父节点（Section Block）
   */
  private buildVoiceGroups(
    voices: SNParserNode[],
    parentNode: SNLayoutBlock,
  ): void {
    if (!voices || voices.length === 0) return;

    // 创建 VoiceGroup
    const voiceGroup = transformVoiceGroup(
      voices,
      this.layoutConfig,
      this.scoreConfig,
      parentNode,
    );
    if (!voiceGroup) return;

    // 计算 VoiceGroup 的宽度（撑满父级）
    this.calculateNodeWidth(voiceGroup);

    // 获取可用宽度（减去 padding）
    const availableWidth = voiceGroup.getAvailableWidth();

    // 收集所有 Voice 的小节信息
    const voiceMeasures: Array<{
      voice: SNParserNode;
      measures: SNParserNode[];
      measureCount: number;
    }> = [];

    for (const voice of voices) {
      if (voice.type !== 'voice') continue;
      const measures = (voice.children || []) as SNParserNode[];
      voiceMeasures.push({
        voice,
        measures,
        measureCount: measures.length,
      });
    }

    if (voiceMeasures.length === 0) return;

    // 小节之间不应该有间隔（measureGap = 0）

    // 1) 计算每个小节在每个 Voice 中的实际宽度，并取同一小节索引的最大值，确保跨声部对齐
    const maxMeasureCount = Math.max(
      ...voiceMeasures.map((vm) => vm.measureCount),
    );
    const maxWidthsByIndex: number[] = [];
    for (let i = 0; i < maxMeasureCount; i++) {
      let maxWidth = 0;
      for (const { measures } of voiceMeasures) {
        const m = measures[i];
        if (!m) continue;
        const w = this.computeMeasureWidthByTicks(m);
        if (w > maxWidth) maxWidth = w;
      }
      // 后备：至少给一个基础宽度，避免0
      if (maxWidth <= 0) maxWidth = 40;
      maxWidthsByIndex.push(maxWidth);
    }

    // 2) 基于最大宽度，使用贪心切分行，得到统一的换行断点
    const lineBreaks: Array<{ start: number; end: number }> = [];
    let cursor = 0;
    while (cursor < maxMeasureCount) {
      let lineWidth = 0;
      const start = cursor;
      while (cursor < maxMeasureCount) {
        const nextWidth = maxWidthsByIndex[cursor];
        if (lineWidth + nextWidth <= availableWidth) {
          lineWidth += nextWidth;
          cursor++;
        } else {
          break;
        }
      }
      if (cursor === start) {
        // 单个小节都放不下，强制至少放一个，防止死循环
        cursor++;
      }
      lineBreaks.push({ start, end: cursor });
    }

    // 3) 按统一断点为每个 Voice 创建行并分配小节
    for (let lineIndex = 0; lineIndex < lineBreaks.length; lineIndex++) {
      const { start, end } = lineBreaks[lineIndex];
      const isLastLine = lineIndex === lineBreaks.length - 1;

      voiceMeasures.forEach(({ voice, measures }, voiceIndex) => {
        const lineMeasures = measures.slice(start, end);

        if (lineMeasures.length === 0 && !isLastLine) {
          return;
        }

        const isLastVoice = voiceIndex === voiceMeasures.length - 1;
        // 每个行组（同一 lineIndex）之后都加行间距，仅在该行组的最后一个 voice 行上加
        const shouldAddBottomMargin = isLastVoice;

        const lineId = `layout-${voice.id}-line-${lineIndex}`;
        const line = transformVoiceLine(
          voice,
          this.layoutConfig,
          this.scoreConfig,
          lineId,
          lineIndex,
          shouldAddBottomMargin,
          voiceGroup,
        );
        if (!line) return;

        this.calculateNodeWidth(line);
        if (lineMeasures.length > 0) {
          // 对于非最后一行，需要拉伸小节以撑满整行
          this.buildMeasures(lineMeasures, line, !isLastLine, availableWidth);
        }
        this.calculateNodePosition(line);
      });
    }

    // 子节点构建完成后，计算 VoiceGroup 的高度和位置
    this.calculateNodeHeight(voiceGroup);
    this.calculateNodePosition(voiceGroup);
  }

  /**
   * 基于 ticks 计算小节理想宽度（像素）
   */
  private computeMeasureWidthByTicks(
    measure: SNParserNode,
    pxPerBeat = 40,
  ): number {
    const timeUnit = getTimeUnitFromNode(measure);
    const timeSignature = measure.getTimeSignature();
    const totalTicks: number = measureDuration(timeSignature, timeUnit);
    const pxPerTick = pxPerBeat / timeUnit.ticksPerBeat;
    return Math.max(20, Math.round(totalTicks * pxPerTick));
  }

  /**
   * 构建 Measure 节点
   * @param measures - Measure 节点数组
   * @param parentNode - 父节点（Line）
   * @param shouldStretch - 是否拉伸小节以撑满整行（非最后一行时）
   * @param availableWidth - 可用宽度（用于拉伸计算）
   */
  private buildMeasures(
    measures: SNParserNode[],
    parentNode: SNLayoutLine,
    shouldStretch = false,
    availableWidth = 0,
  ): void {
    // 先计算所有小节的基础宽度
    const baseWidths: number[] = [];
    for (const measure of measures) {
      const baseWidth = this.computeMeasureWidthByTicks(measure);
      baseWidths.push(baseWidth);
    }

    // 计算总宽度
    const totalBaseWidth = baseWidths.reduce((sum, w) => sum + w, 0);

    // 如果需要拉伸且总宽度小于可用宽度，计算拉伸比例
    let stretchRatio = 1;
    if (
      shouldStretch &&
      totalBaseWidth > 0 &&
      availableWidth > totalBaseWidth
    ) {
      stretchRatio = availableWidth / totalBaseWidth;
    }

    // 构建每个小节
    for (let i = 0; i < measures.length; i++) {
      const measure = measures[i];
      // 使用 transformMeasure 转换 Measure 为 Element
      const element = transformMeasure(measure, this.scoreConfig, parentNode);

      if (!element) continue;

      // 应用拉伸后的宽度
      const finalWidth = Math.round(baseWidths[i] * stretchRatio);
      if (element.layout) {
        element.layout.width = finalWidth;
      }

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
   * 按照元素的tick（duration）按比例分配小节宽度，并添加左右padding避免元素顶在小节线上
   *
   * @param elements - Measure 的子元素（Note/Rest/Lyric/Tuplet）
   * @param parentNode - 父节点（Element，即小节）
   */
  private buildMeasureElements(
    elements: SNParserNode[],
    parentNode: SNLayoutElement,
  ): void {
    if (!elements || elements.length === 0) return;

    // 获取小节的总duration（通过小节节点获取timeUnit和timeSignature）
    const measureNode = parentNode.data as SNParserNode;
    if (!measureNode) return;

    const timeUnit = getTimeUnitFromNode(measureNode);
    const timeSignature = measureNode.getTimeSignature();
    const measureTotalTicks = measureDuration(timeSignature, timeUnit);

    // 获取小节的实际宽度（已经设置好的）
    const measureWidth =
      typeof parentNode.layout?.width === 'number'
        ? parentNode.layout.width
        : 0;

    // 左右padding，避免元素顶在小节线上
    const horizontalPadding = 8; // 可后续做成配置项
    const usableWidth = Math.max(0, measureWidth - horizontalPadding * 2);

    // 过滤出有 duration 的元素（note、rest等），忽略没有 duration 的元素（如 tie、某些装饰元素）
    const elementsWithDuration = elements.filter(
      (el) => el.duration && el.duration > 0,
    );

    // 计算所有有 duration 的元素的总 ticks
    const totalElementsTicks = elementsWithDuration.reduce(
      (sum, el) => sum + (el.duration || 0),
      0,
    );

    // 如果元素的总 ticks 不等于小节的总 ticks，需要调整比例
    // 使用元素实际的总 ticks 来计算比例，确保元素能正确分布
    const ticksForRatio =
      totalElementsTicks > 0 ? totalElementsTicks : measureTotalTicks;

    // 计算每个元素的起始位置和宽度（基于tick比例）
    let currentTickOffset = 0;
    for (let i = 0; i < elements.length; i++) {
      const dataElement = elements[i];
      const elementDuration = dataElement.duration || 0;

      // 使用 transformMeasureElement 转换元素
      const layoutElement = transformMeasureElement(
        dataElement,
        this.scoreConfig,
        parentNode,
      );

      if (!layoutElement || !layoutElement.layout) continue;

      // 对于没有 duration 的元素（如 tie），跳过位置计算，保持默认位置
      if (elementDuration <= 0) {
        // Y坐标使用父节点的padding.top
        if (parentNode.layout) {
          const parentPadding = parentNode.layout.padding || {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          };
          layoutElement.layout.y = parentPadding.top;
        }

        // 处理元素的 children（歌词等）
        if (dataElement.children && dataElement.children.length > 0) {
          // 对于没有 duration 的元素，使用默认位置和宽度
          const defaultX =
            typeof layoutElement.layout.x === 'number'
              ? layoutElement.layout.x
              : 0;
          const defaultWidth =
            typeof layoutElement.layout.width === 'number'
              ? layoutElement.layout.width
              : 20;
          this.buildElementChildren(
            dataElement.children,
            layoutElement,
            defaultX,
            defaultWidth,
          );
        }
        continue;
      }

      // 计算元素在小节内的位置（基于tick比例）
      const startRatio = currentTickOffset / ticksForRatio;
      const durationRatio = elementDuration / ticksForRatio;

      // 计算元素的实际位置和宽度
      const elementX = horizontalPadding + startRatio * usableWidth;
      const elementWidth = durationRatio * usableWidth;

      // 更新元素的布局信息
      layoutElement.layout.x = elementX;
      layoutElement.layout.width = Math.max(10, elementWidth); // 最小宽度10px

      // 更新累计的tick偏移
      currentTickOffset += elementDuration;

      // Y坐标使用父节点的padding.top（由布局计算）
      if (parentNode.layout) {
        const parentPadding = parentNode.layout.padding || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };
        layoutElement.layout.y = parentPadding.top;
      }

      // 处理元素的 children（歌词等）
      if (dataElement.children && dataElement.children.length > 0) {
        this.buildElementChildren(
          dataElement.children,
          layoutElement,
          layoutElement.layout.x,
          layoutElement.layout.width,
        );
      }
    }
  }

  /**
   * 构建元素的子元素（如歌词）
   *
   * @param children - 元素的子节点数组（如歌词）
   * @param parentLayoutElement - 父布局元素节点
   * @param _parentX - 父元素的X坐标（预留参数，暂未使用）
   * @param _parentWidth - 父元素的宽度（预留参数，暂未使用）
   */
  private buildElementChildren(
    children: SNParserNode[],
    parentLayoutElement: SNLayoutElement,
    _parentX: number,
    _parentWidth: number,
  ): void {
    if (!children || children.length === 0) return;

    // 过滤出歌词节点
    const lyrics = children.filter(
      (child) => child.type === 'lyric',
    ) as SNParserLyric[];

    if (lyrics.length === 0) return;

    // 按 verseNumber 分组歌词
    const lyricsByVerse = new Map<number, SNParserLyric[]>();
    for (const lyric of lyrics) {
      if (lyric.skip) continue; // 跳过标记为 skip 的歌词

      const verseNumber = lyric.verseNumber || 0;
      if (!lyricsByVerse.has(verseNumber)) {
        lyricsByVerse.set(verseNumber, []);
      }
      lyricsByVerse.get(verseNumber)!.push(lyric);
    }

    // 为每个歌词行创建布局元素
    // 歌词的Y坐标应该在音符下方，不同 verseNumber 的歌词应该垂直排列
    const lyricLineHeight = 20; // 每行歌词的高度（可后续做成配置项）
    const lyricBaseOffset = 30; // 歌词距离音符的基偏移（可后续做成配置项）

    for (const [verseNumber, verseLyrics] of lyricsByVerse.entries()) {
      // 对每个 verseNumber，可能有多个歌词（如 multi-word 的情况）
      // 这里我们为每个歌词创建一个布局元素
      for (const lyric of verseLyrics) {
        // 使用 transformMeasureElement 转换歌词元素
        const lyricLayoutElement = transformMeasureElement(
          lyric,
          this.scoreConfig,
          parentLayoutElement,
        );

        if (!lyricLayoutElement || !lyricLayoutElement.layout) continue;

        // 设置歌词的位置
        if (lyric.targetId && parentLayoutElement.parent) {
          // 从measure（parentLayoutElement的父元素）中查找对应的音符元素
          const measureElement = parentLayoutElement.parent;
          if (measureElement.children) {
            const targetNote = measureElement.children.find(
              (child) =>
                child.data?.id === lyric.targetId &&
                child.data?.type === 'note',
            );
            if (targetNote && targetNote.layout) {
              const noteWidth =
                typeof targetNote.layout.width === 'number'
                  ? targetNote.layout.width
                  : 0;
              const noteCx = Math.max(0, noteWidth / 2);
              lyricLayoutElement.layout.x = noteCx;
            }
          }
        }
        // 歌词宽度根据文本内容自适应（这里先设置为文本宽度，后续可以根据实际文本计算）
        lyricLayoutElement.layout.width = Math.max(
          30,
          lyric.syllable.length * 12, // 粗略估算：每个字符12px
        );

        // Y坐标：音符下方，根据 verseNumber 垂直排列
        if (parentLayoutElement.layout) {
          // 歌词的Y坐标 = 父元素的Y + 父元素的高度 + 基偏移 + verseNumber * 行高
          const parentY =
            typeof parentLayoutElement.layout.y === 'number'
              ? parentLayoutElement.layout.y
              : 0;
          const parentHeight =
            typeof parentLayoutElement.layout.height === 'number'
              ? parentLayoutElement.layout.height
              : 0;

          lyricLayoutElement.layout.y =
            parentY +
            parentHeight +
            lyricBaseOffset +
            verseNumber * lyricLineHeight;
        }
      }
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

    switch (node.type) {
      case SNLayoutNodeType.ROOT: {
        // Root节点的宽度在渲染时由渲染器根据SVG实际宽度设置
        // 这里先设置为0，表示自适应
        if (
          node.layout.width === null ||
          node.layout.width === 'auto' ||
          typeof node.layout.width !== 'number'
        ) {
          node.layout.width = 0;
        }
        break;
      }

      case SNLayoutNodeType.PAGE: {
        // Page宽度已在构建时设置，确保是数值类型
        if (
          node.layout.width === null ||
          node.layout.width === 'auto' ||
          typeof node.layout.width !== 'number'
        ) {
          node.layout.width = 0;
        }
        break;
      }

      case SNLayoutNodeType.BLOCK:
      case SNLayoutNodeType.LINE: {
        // Block和Line：撑满父级宽度
        if (node instanceof SNLayoutBlock || node instanceof SNLayoutLine) {
          node.calculateWidth();
        }
        break;
      }

      case SNLayoutNodeType.ELEMENT: {
        // Element：如果已有固定宽度，尊重之；否则根据子节点计算
        const hasFixedWidth =
          node.layout.width !== null &&
          typeof node.layout.width === 'number' &&
          node.layout.width > 0;

        if (!hasFixedWidth) {
          // 检查是否是元信息标题容器元素（需要撑满父级宽度）
          const nodeData = node.data as any;
          const isMetadataTitleContainer =
            nodeData?.type === 'metadata-title-container' ||
            nodeData?.type === 'metadata-section-title-container';

          if (isMetadataTitleContainer && node.parent) {
            // 元信息标题元素：撑满父级可用宽度
            const parentAvailableWidth = node.getParentAvailableWidth();
            if (parentAvailableWidth !== null && parentAvailableWidth > 0) {
              const padding = node.layout.padding || {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              };
              node.layout.width =
                parentAvailableWidth - padding.left - padding.right;
            } else {
              node.layout.width = 0;
            }
          } else if (node.children && node.children.length > 0) {
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
        break;
      }

      default:
        // 未知类型，不做处理
        break;
    }
  }

  /**
   * 计算节点的高度
   *
   * @param node - 当前节点
   */
  private calculateNodeHeight(node: SNLayoutNode): void {
    if (!node.layout) return;

    switch (node.type) {
      case SNLayoutNodeType.ROOT:
      case SNLayoutNodeType.BLOCK: {
        // Root和Block：根据子节点内容撑开高度
        if (node instanceof SNLayoutRoot || node instanceof SNLayoutBlock) {
          node.calculateHeight();
        }
        break;
      }

      case SNLayoutNodeType.PAGE: {
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
        break;
      }

      case SNLayoutNodeType.LINE: {
        // Line节点高度按配置设置，不需要计算（已在转换器中设置）
        // 这里不做处理
        break;
      }

      case SNLayoutNodeType.ELEMENT: {
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
        break;
      }

      default:
        // 未知类型，不做处理
        break;
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
      // 检查是否是右对齐的元信息元素（如作词作曲）
      const nodeData = node.data as any;
      const isRightAlignedMetadata =
        nodeData?.type === 'metadata-contributors' &&
        nodeData?.align === 'right';

      if (isRightAlignedMetadata && node.parent instanceof SNLayoutLine) {
        // 右对齐的元信息元素：计算位置使其位于行的右侧
        // 确保父节点（Line）的宽度已计算
        if (
          !parentLayout.width ||
          typeof parentLayout.width !== 'number' ||
          parentLayout.width === 0
        ) {
          // 如果父节点宽度未计算，先计算父节点宽度
          this.calculateNodeWidth(node.parent);
        }

        const parentWidth =
          typeof parentLayout.width === 'number' ? parentLayout.width : 0;
        const elementWidth =
          typeof node.layout.width === 'number' ? node.layout.width : 0;
        const elementPadding = node.layout.padding || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };

        // 如果父节点宽度仍然为0，使用父节点的父节点宽度
        let actualParentWidth = parentWidth;
        if (actualParentWidth === 0 && node.parent.parent?.layout) {
          const grandParentWidth =
            typeof node.parent.parent.layout.width === 'number'
              ? node.parent.parent.layout.width
              : 0;
          if (grandParentWidth > 0) {
            actualParentWidth = grandParentWidth;
          }
        }

        // x = 父节点可用宽度 - 元素宽度
        // 父节点可用宽度 = 父节点宽度 - 父节点padding.left - 父节点padding.right
        const parentAvailableWidth =
          actualParentWidth - parentPadding.left - parentPadding.right;
        // 元素实际占用宽度 = 元素宽度 + 元素padding.left + 元素padding.right
        const elementTotalWidth =
          elementWidth + elementPadding.left + elementPadding.right;
        // x = 父节点padding.left + (父节点可用宽度 - 元素实际占用宽度)
        node.layout.x =
          parentPadding.left + parentAvailableWidth - elementTotalWidth;
      } else {
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
      }
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
