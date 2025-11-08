import { SNLayoutBlock, SNLayoutLine, SNLayoutElement } from '@layout/node';
import { ScoreConfig } from '@manager/config';
import type { SNParserNode } from '@data/node';
import type { SNLayoutBlock as SNLayoutBlockType } from '@layout/node';
import type { SNScoreProps } from '@data/model/props';
import { formatMusicInfo, formatContributors } from './metadata-utils';

/**
 * 转换 Section 节点
 * @param section - 数据层 Section 节点
 * @param scoreConfig - 乐谱配置
 * @param parentNode - 父布局节点（Block）
 */
export function transformSection(
  section: SNParserNode,
  scoreConfig: ScoreConfig,
  parentNode: SNLayoutBlockType,
): SNLayoutBlock | null {
  if (section.type !== 'section') {
    return null;
  }

  const sectionConfig = scoreConfig.getSection();
  const sectionBlock = new SNLayoutBlock(`layout-${section.id}`);
  sectionBlock.data = section;

  sectionBlock.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: 0, // 由布局计算填充
    margin: {
      top: 0,
      right: 0,
      bottom: sectionConfig.spacing.sectionGap ?? 0,
      left: 0,
    },
  });

  // 处理元信息（章节标题、调号拍号、作词作曲等）
  const props = section.props as SNScoreProps | undefined;
  if (props) {
    if (props.title || props.subtitle) {
      const titleLine = createSectionTitleLine(
        `layout-${section.id}-title`,
        props.title,
        props.subtitle,
      );
      sectionBlock.addChildren(titleLine);
    }

    const musicInfo = formatMusicInfo(props);
    const contributorsInfo = formatContributors(props.contributors);
    if (musicInfo || contributorsInfo) {
      const infoLine = createSectionInfoLine(
        `layout-${section.id}-info`,
        musicInfo,
        contributorsInfo,
      );
      sectionBlock.addChildren(infoLine);
    }
  }

  parentNode.addChildren(sectionBlock);
  return sectionBlock;
}

/**
 * 创建章节标题行（居中显示，包含title和subtitle）
 * @param id - 行ID
 * @param title - 标题文本
 * @param subtitle - 副标题文本（可选）
 */
function createSectionTitleLine(
  id: string,
  title?: string,
  subtitle?: string,
): SNLayoutLine {
  const titleLine = new SNLayoutLine(id);
  const hasSubtitle = !!subtitle;
  const lineHeight = hasSubtitle ? 45 : 35; // 章节标题行高度（比乐谱标题稍小）

  titleLine.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: lineHeight,
    padding: { top: 8, right: 0, bottom: 8, left: 0 },
    margin: { top: 0, right: 0, bottom: 10, left: 0 }, // 章节标题行与信息行之间的间距
  });

  const titleContainer = new SNLayoutElement(`${id}-container`);
  titleContainer.data = {
    type: 'metadata-section-title-container',
    title: title,
    subtitle: subtitle,
    align: 'center',
  } as any;

  titleContainer.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: hasSubtitle ? 35 : 19,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  titleLine.addChildren(titleContainer);
  return titleLine;
}

/**
 * 创建章节信息行（左边：调号拍号，右边：作词作曲）
 * @param id - 行ID
 * @param musicInfo - 音乐信息文本（调号、拍号、速度）
 * @param contributorsInfo - 创作者信息文本
 */
function createSectionInfoLine(
  id: string,
  musicInfo: string,
  contributorsInfo: string,
): SNLayoutLine {
  const infoLine = new SNLayoutLine(id);
  infoLine.updateLayout({
    x: 0,
    y: 0,
    width: 0, // 由布局计算填充（撑满父级）
    height: 25, // 信息行高度（比乐谱信息行稍小）
    padding: { top: 3, right: 0, bottom: 3, left: 0 },
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
      height: 19,
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
      x: 0,
      y: 0,
      width: estimatedWidth,
      height: 19,
      padding: { top: 0, right: 0, bottom: 0, left: 10 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    infoLine.addChildren(rightElement);
  }

  return infoLine;
}
