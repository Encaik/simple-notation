import { SNLayoutBlock, SNLayoutLine, SNLayoutElement } from '@layout/node';
import { ScoreConfig } from '@manager/config';
import type { SNParserNode } from '@data/node';
import type { SNLayoutBlock as SNLayoutBlockType } from '@layout/node';
import type { SNScoreProps } from '@data/model/props';
import { formatMusicInfo, formatContributors } from './metadata-utils';

/**
 * 转换 Section 节点
 *
 * @param section - 数据层 Section 节点
 * @param scoreConfig - 乐谱配置
 * @param parentNode - 父布局节点（Block）
 * @returns 布局层 Block 节点
 */
export function transformSection(
  section: SNParserNode,
  scoreConfig: ScoreConfig,
  parentNode: SNLayoutBlockType,
): SNLayoutBlock | null {
  // 类型检查：确保是 Section
  if (section.type !== 'section') {
    return null;
  }

  const sectionConfig = scoreConfig.getSection();

  // 创建 Block 节点（默认撑满父级宽度）
  const sectionBlock = new SNLayoutBlock(`layout-${section.id}`);
  sectionBlock.data = section;

  // 设置配置
  sectionBlock.updateLayout({
    x: 0, // 初始位置，由布局计算填充
    y: 0, // 初始位置，由布局计算填充
    width: 0, // 由布局计算填充（撑满父级）
    height: 0, // 由布局计算填充
    margin: {
      top: 0,
      right: 0,
      bottom: sectionConfig.spacing.sectionGap || 0,
      left: 0,
    },
  });

  // 处理元信息（章节标题、调号拍号、作词作曲等）
  const props = section.props as SNScoreProps | undefined;
  if (props) {
    // 1. 创建章节标题行（居中显示，包含title和subtitle）
    if (props.title || props.subtitle) {
      const titleLine = createSectionTitleLine(
        `layout-${section.id}-title`,
        props.title,
        props.subtitle,
        sectionBlock,
      );
      sectionBlock.addChildren(titleLine);
    }

    // 2. 创建信息行（左边：调号拍号，右边：作词作曲）
    // 注意：Section 的信息行只在有不同于 Score 的信息时才显示
    const musicInfo = formatMusicInfo(props);
    const contributorsInfo = formatContributors(props.contributors);

    if (musicInfo || contributorsInfo) {
      const infoLine = createSectionInfoLine(
        `layout-${section.id}-info`,
        musicInfo,
        contributorsInfo,
        sectionBlock,
      );
      sectionBlock.addChildren(infoLine);
    }
  }

  // 建立父子关系
  parentNode.addChildren(sectionBlock);

  return sectionBlock;
}

/**
 * 创建章节标题行（居中显示，包含title和subtitle）
 *
 * @param id - 行ID
 * @param title - 标题文本
 * @param subtitle - 副标题文本（可选）
 * @param parentBlock - 父Block节点
 * @returns 标题行节点
 */
function createSectionTitleLine(
  id: string,
  title?: string,
  subtitle?: string,
  _parentBlock?: SNLayoutBlock,
): SNLayoutLine {
  const titleLine = new SNLayoutLine(id);

  // 根据是否有subtitle调整行高度
  const hasSubtitle = !!subtitle;
  const lineHeight = hasSubtitle ? 45 : 35; // 有subtitle时高度稍大

  titleLine.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: lineHeight, // 章节标题行高度（比乐谱标题稍小）
    padding: {
      top: 8,
      right: 0,
      bottom: 8,
      left: 0,
    },
    margin: {
      top: 0,
      right: 0,
      bottom: 10, // 章节标题行与信息行之间的间距
      left: 0,
    },
  });

  // 创建标题容器元素（包含title和subtitle，一起垂直居中）
  const titleContainer = new SNLayoutElement(`${id}-container`);
  titleContainer.data = {
    type: 'metadata-section-title-container',
    title: title,
    subtitle: subtitle,
    align: 'center',
  } as any;

  // 容器高度：如果有subtitle，需要容纳两行文本
  const containerHeight = hasSubtitle ? 35 : 19;

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
 * 创建章节信息行（左边：调号拍号，右边：作词作曲）
 *
 * @param id - 行ID
 * @param musicInfo - 音乐信息文本（调号、拍号、速度）
 * @param contributorsInfo - 创作者信息文本
 * @param parentBlock - 父Block节点
 * @returns 信息行节点
 */
function createSectionInfoLine(
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
    height: 25, // 信息行高度（比乐谱信息行稍小）
    padding: {
      top: 3,
      right: 0,
      bottom: 3,
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
      height: 19,
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
      x: 0,
      y: 0,
      width: estimatedWidth, // 估算宽度，后续可以根据实际文本计算
      height: 19,
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
