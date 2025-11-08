/**
 * 元信息格式化工具函数
 * 用于格式化乐谱元信息（标题、调号、拍号、速度、创作者等）为可显示的文本
 */

import type {
  SNKeySignature,
  SNTimeSignature,
  SNTempo,
} from '@core/model/music';
import type { SNContributor, SNScoreProps } from '@data/model/props';

/**
 * 格式化调号文本
 * @param keySignature - 调号对象
 * @returns 格式化后的调号文本，如 "1 = C"、"1 = ♯G"、"1 = ♭F"
 */
export function formatKeySignature(keySignature?: SNKeySignature): string {
  if (!keySignature) return '';

  const { symbol, letter } = keySignature;
  const symbolText = symbol === 'sharp' ? '♯' : symbol === 'flat' ? '♭' : '';

  return `1 = ${symbolText}${letter}`;
}

/**
 * 格式化拍号文本
 * @param timeSignature - 拍号对象
 * @returns 格式化后的拍号文本，如 "4/4"、"3/4"、"6/8"
 */
export function formatTimeSignature(timeSignature?: SNTimeSignature): string {
  if (!timeSignature) return '';
  return `${timeSignature.numerator}/${timeSignature.denominator}`;
}

/**
 * 格式化速度文本
 * @param tempo - 速度对象
 * @returns 格式化后的速度文本，如 "♩ = 120"
 */
export function formatTempo(tempo?: SNTempo): string {
  if (!tempo) return '';
  return `♩ = ${tempo.value}`;
}

/**
 * 格式化创作者信息文本
 * @param contributors - 创作者列表
 * @returns 格式化后的创作者文本，如 "作曲：张三"、"作词：李四"
 */
export function formatContributors(contributors?: SNContributor[]): string {
  if (!contributors?.length) return '';

  const roleMap: Record<SNContributor['role'], string> = {
    composer: '作曲',
    lyricist: '作词',
    arranger: '编曲',
    transcriber: '转录',
  };

  return contributors
    .map(
      (contributor) =>
        `${roleMap[contributor.role] || contributor.role}：${contributor.name}`,
    )
    .join('  ');
}

/**
 * 提取并格式化音乐信息（调号、拍号、速度）
 * @param props - 乐谱属性
 * @returns 格式化后的音乐信息文本，如 "1 = C  4/4  ♩ = 120"
 */
export function formatMusicInfo(props?: SNScoreProps): string {
  if (!props) return '';

  const parts: string[] = [];
  const keyText = formatKeySignature(props.keySignature);
  if (keyText) parts.push(keyText);

  const timeText = formatTimeSignature(props.timeSignature);
  if (timeText) parts.push(timeText);

  const tempoText = formatTempo(props.tempo);
  if (tempoText) parts.push(tempoText);

  return parts.join('  ');
}
