import type { SNParserScore } from '@data/node';
import type { SNLayoutRoot, SNLayoutPage } from '@layout/node';
import { SNLayoutBlock, SNLayoutLine, SNLayoutElement } from '@layout/node';
import { LayoutConfig, ScoreConfig } from '@manager/config';
import type { SNScoreProps } from '@data/model/props';
import { formatMusicInfo, formatContributors } from './metadata-utils';
import { buildSections } from './build-sections';
import { calculateNodeWidth } from './calculate-width';
import { calculateNodeHeight } from './calculate-height';
import { calculateNodePosition } from './calculate-position';

/**
 * 构建 Score 节点
 *
 * 宽度计算：自顶向下（父节点 → 子节点）
 * 高度计算：自底向上（子节点 → 父节点）
 *
 * @param scores - Score 节点数组
 * @param parentNode - 父节点（Root 或 Page）
 * @param layoutConfig - 布局配置
 * @param scoreConfig - 乐谱配置
 */
export function buildScores(
  scores: SNParserScore[],
  parentNode: SNLayoutRoot | SNLayoutPage,
  layoutConfig: LayoutConfig,
  scoreConfig: ScoreConfig,
): void {
  for (const score of scores) {
    // 转换 Score 为 Block
    const scoreBlock = transformScore(score, layoutConfig, parentNode);

    // ========== 宽度计算（自顶向下）==========
    // 1. 先计算父节点（Score Block）的宽度
    calculateNodeWidth(scoreBlock);

    // 2. 计算元信息行的宽度（基于父节点宽度）
    if (scoreBlock.children) {
      for (const child of scoreBlock.children) {
        calculateNodeWidth(child);
      }
    }

    // 3. 构建 Section 节点（在构建过程中会递归计算宽度）
    buildSections(score.children || [], scoreBlock, layoutConfig, scoreConfig);

    // ========== 高度计算（自底向上）==========
    // 4. 所有子节点构建完成后，计算子节点的高度
    if (scoreBlock.children) {
      for (const child of scoreBlock.children) {
        calculateNodeHeight(child);
        // 如果子节点有子节点，也需要计算高度
        if (child.children) {
          for (const grandChild of child.children) {
            calculateNodeHeight(grandChild);
          }
        }
      }
    }

    // 5. 最后计算父节点（Score Block）的高度（基于子节点高度）
    calculateNodeHeight(scoreBlock);

    // ========== 位置计算（自顶向下）==========
    // 6. 计算所有节点的位置
    calculateNodePosition(scoreBlock);
    if (scoreBlock.children) {
      for (const child of scoreBlock.children) {
        calculateNodePosition(child);
        if (child.children) {
          for (const grandChild of child.children) {
            calculateNodePosition(grandChild);
          }
        }
      }
    }
  }
}

/**
 * 转换 Score 节点
 * @param score - 数据层 Score 节点
 * @param layoutConfig - 布局配置
 * @param parentNode - 父布局节点（Root 或 Page）
 */
function transformScore(
  score: SNParserScore,
  layoutConfig: LayoutConfig,
  parentNode: SNLayoutRoot | SNLayoutPage,
): SNLayoutBlock {
  const blockConfig = layoutConfig.getBlock();
  const scoreBlock = new SNLayoutBlock(`layout-score-${score.id}`);
  scoreBlock.data = score;

  scoreBlock.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: 0, // 由布局计算填充
    padding: blockConfig.spacing.padding ?? {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    margin: blockConfig.spacing.margin ?? {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  });

  // 处理元信息（标题、调号拍号、作词作曲等）
  const props = score.props as SNScoreProps | undefined;
  if (props) {
    if (props.title || props.subtitle) {
      const titleLine = createTitleLine(
        `layout-score-${score.id}-title`,
        props.title,
        props.subtitle,
      );
      scoreBlock.addChildren(titleLine);
    }

    const musicInfo = formatMusicInfo(props);
    const contributorsInfo = formatContributors(props.contributors);
    if (musicInfo || contributorsInfo) {
      const infoLine = createInfoLine(
        `layout-score-${score.id}-info`,
        musicInfo,
        contributorsInfo,
      );
      scoreBlock.addChildren(infoLine);
    }
  }

  parentNode.addChildren(scoreBlock);
  return scoreBlock;
}

/**
 * 创建标题行（居中显示，包含title和subtitle）
 * @param id - 行ID
 * @param title - 标题文本
 * @param subtitle - 副标题文本（可选）
 */
function createTitleLine(
  id: string,
  title?: string,
  subtitle?: string,
): SNLayoutLine {
  const titleLine = new SNLayoutLine(id);
  const hasSubtitle = !!subtitle;
  const lineHeight = hasSubtitle ? 50 : 40;

  titleLine.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: lineHeight,
    padding: { top: 10, right: 0, bottom: 10, left: 0 },
    margin: { top: 0, right: 0, bottom: 10, left: 0 }, // 标题行与信息行之间的间距
  });

  const titleContainer = new SNLayoutElement(`${id}-container`);
  titleContainer.data = {
    type: 'metadata-title-container',
    title: title,
    subtitle: subtitle,
    align: 'center',
  } as any;

  titleContainer.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: hasSubtitle ? 40 : 20,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  titleLine.addChildren(titleContainer);
  return titleLine;
}

/**
 * 创建信息行（左边：调号拍号，右边：作词作曲）
 * @param id - 行ID
 * @param musicInfo - 音乐信息文本（调号、拍号、速度）
 * @param contributorsInfo - 创作者信息文本
 */
function createInfoLine(
  id: string,
  musicInfo: string,
  contributorsInfo: string,
): SNLayoutLine {
  const infoLine = new SNLayoutLine(id);
  infoLine.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: 30,
    padding: { top: 5, right: 0, bottom: 5, left: 0 },
    margin: { top: 0, right: 0, bottom: 10, left: 0 }, // 信息行与乐谱内容之间的间距
  });

  if (musicInfo) {
    const leftElement = new SNLayoutElement(`${id}-left-element`);
    leftElement.data = {
      type: 'metadata-music-info',
      text: musicInfo,
      align: 'left',
    } as any;
    const estimatedWidth = Math.max(100, musicInfo.length * 12);
    leftElement.updateLayout({
      x: 0,
      y: 0,
      width: estimatedWidth,
      height: 20,
      padding: { top: 0, right: 10, bottom: 0, left: 0 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    infoLine.addChildren(leftElement);
  }

  if (contributorsInfo) {
    const rightElement = new SNLayoutElement(`${id}-right-element`);
    rightElement.data = {
      type: 'metadata-contributors',
      text: contributorsInfo,
      align: 'right',
    } as any;
    const estimatedWidth = Math.max(100, contributorsInfo.length * 12);
    rightElement.updateLayout({
      x: 0, // 位置会在builder中计算，使其位于行的右侧
      y: 0,
      width: estimatedWidth,
      height: 20,
      padding: { top: 0, right: 0, bottom: 0, left: 10 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    infoLine.addChildren(rightElement);
  }

  return infoLine;
}
