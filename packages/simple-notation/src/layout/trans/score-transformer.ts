import { SNLayoutBlock, SNLayoutLine, SNLayoutElement } from '@layout/node';
import { LayoutConfig } from '@manager/config';
import type { SNParserScore } from '@data/node';
import type { SNLayoutRoot, SNLayoutPage } from '@layout/node';
import type { SNScoreProps } from '@data/model/props';
import { formatMusicInfo, formatContributors } from './metadata-utils';

/**
 * 转换 Score 节点
 *
 * @param score - 数据层 Score 节点
 * @param layoutConfig - 布局配置
 * @param parentNode - 父布局节点（Root 或 Page）
 * @returns 布局层 Block 节点
 */
export function transformScore(
  score: SNParserScore,
  layoutConfig: LayoutConfig,
  parentNode: SNLayoutRoot | SNLayoutPage,
): SNLayoutBlock {
  const blockConfig = layoutConfig.getBlock();

  // 创建 Block 节点（默认撑满父级宽度）
  const scoreBlock = new SNLayoutBlock(`layout-score-${score.id}`);
  scoreBlock.data = score;

  // 设置块配置
  scoreBlock.updateLayout({
    x: 0, // 初始位置，由布局计算填充
    y: 0, // 初始位置，由布局计算填充
    width: 0, // 由布局计算填充（撑满父级）
    height: 0, // 由布局计算填充
    padding: blockConfig.spacing.padding || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    margin: blockConfig.spacing.margin || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  });

  // 处理元信息（标题、调号拍号、作词作曲等）
  const props = score.props as SNScoreProps | undefined;
  if (props) {
    // 1. 创建标题行（居中显示，包含title和subtitle）
    if (props.title || props.subtitle) {
      const titleLine = createTitleLine(
        `layout-score-${score.id}-title`,
        props.title,
        props.subtitle,
        scoreBlock,
      );
      scoreBlock.addChildren(titleLine);
    }

    // 2. 创建信息行（左边：调号拍号，右边：作词作曲）
    const musicInfo = formatMusicInfo(props);
    const contributorsInfo = formatContributors(props.contributors);

    if (musicInfo || contributorsInfo) {
      const infoLine = createInfoLine(
        `layout-score-${score.id}-info`,
        musicInfo,
        contributorsInfo,
        scoreBlock,
      );
      scoreBlock.addChildren(infoLine);
    }
  }

  // 建立父子关系
  parentNode.addChildren(scoreBlock);

  return scoreBlock;
}

/**
 * 创建标题行（居中显示，包含title和subtitle）
 *
 * @param id - 行ID
 * @param title - 标题文本
 * @param subtitle - 副标题文本（可选）
 * @param parentBlock - 父Block节点
 * @returns 标题行节点
 */
function createTitleLine(
  id: string,
  title?: string,
  subtitle?: string,
  _parentBlock?: SNLayoutBlock,
): SNLayoutLine {
  const titleLine = new SNLayoutLine(id);

  // 根据是否有subtitle调整行高度
  const hasSubtitle = !!subtitle;
  const lineHeight = hasSubtitle ? 50 : 40; // 有subtitle时高度稍大

  titleLine.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: lineHeight,
    padding: {
      top: 10,
      right: 0,
      bottom: 10,
      left: 0,
    },
    margin: {
      top: 0,
      right: 0,
      bottom: 10, // 标题行与信息行之间的间距
      left: 0,
    },
  });

  // 创建标题容器元素（包含title和subtitle，一起垂直居中）
  const titleContainer = new SNLayoutElement(`${id}-container`);
  titleContainer.data = {
    type: 'metadata-title-container',
    title: title,
    subtitle: subtitle,
    align: 'center',
  } as any;

  // 容器高度：如果有subtitle，需要容纳两行文本
  const containerHeight = hasSubtitle ? 40 : 20;

  titleContainer.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: containerHeight,
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  });

  titleLine.addChildren(titleContainer);
  return titleLine;
}

/**
 * 创建信息行（左边：调号拍号，右边：作词作曲）
 *
 * @param id - 行ID
 * @param musicInfo - 音乐信息文本（调号、拍号、速度）
 * @param contributorsInfo - 创作者信息文本
 * @param parentBlock - 父Block节点
 * @returns 信息行节点
 */
function createInfoLine(
  id: string,
  musicInfo: string,
  contributorsInfo: string,
  _parentBlock: SNLayoutBlock,
): SNLayoutLine {
  const infoLine = new SNLayoutLine(id);
  infoLine.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: 30, // 信息行高度
    padding: {
      top: 5,
      right: 0,
      bottom: 5,
      left: 0,
    },
    margin: {
      top: 0,
      right: 0,
      bottom: 10, // 信息行与乐谱内容之间的间距
      left: 0,
    },
  });

  // 创建左侧Element（调号拍号）
  if (musicInfo) {
    const leftElement = new SNLayoutElement(`${id}-left-element`);
    leftElement.data = {
      type: 'metadata-music-info',
      text: musicInfo,
      align: 'left',
    } as any;
    // 估算文本宽度（每个字符约12px）
    const estimatedWidth = Math.max(100, musicInfo.length * 12);
    leftElement.updateLayout({
      x: 0,
      y: 0,
      width: estimatedWidth, // 估算宽度，后续可以根据实际文本计算
      height: 20,
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 0,
      },
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });

    infoLine.addChildren(leftElement);
  }

  // 创建右侧Element（作词作曲）
  if (contributorsInfo) {
    const rightElement = new SNLayoutElement(`${id}-right-element`);
    rightElement.data = {
      type: 'metadata-contributors',
      text: contributorsInfo,
      align: 'right',
    } as any;
    // 估算文本宽度（每个字符约12px）
    const estimatedWidth = Math.max(100, contributorsInfo.length * 12);
    rightElement.updateLayout({
      x: 0, // 位置会在builder中计算，使其位于行的右侧
      y: 0,
      width: estimatedWidth, // 估算宽度，后续可以根据实际文本计算
      height: 20,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10,
      },
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });

    infoLine.addChildren(rightElement);
  }

  return infoLine;
}
