import { SvgUtils } from '@utils';
import { SNConfig } from '@config';
import { SNScoreType } from '@types';
import { SNMeasure } from '@components';
import { SNNote } from '../components/note';
import { SNRuntime } from '@config';

function getCurrentBeatValue(): number {
  // SNRuntime.info.time: "4" 表示四分音符为一拍，"8" 表示八分音符为一拍，"2" 表示二分音符为一拍
  const timeStr = SNRuntime.info?.time;
  const denominator = Number(timeStr);
  if (!denominator || isNaN(denominator)) return 1; // 默认四分音符为一拍
  // 四分音符为一拍 => 1，八分音符为一拍 => 0.5，二分音符为一拍 => 2
  return 4 / denominator;
}

function groupNotesForBeam(notes: SNNote[]): SNNote[][] {
  const beatValue = getCurrentBeatValue();
  const groups: SNNote[][] = [];
  let current: SNNote[] = [];
  let acc = 0;
  let lastUnderlineCount: number | undefined = undefined;
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const nodeTime = note.nodeTime ?? 0;
    const underlineCount = note.underlineCount ?? 0;

    // 如果下划线数量变化，强制断组
    if (
      lastUnderlineCount !== undefined &&
      underlineCount !== lastUnderlineCount
    ) {
      if (current.length > 0) {
        groups.push(current);
        current = [];
        acc = 0;
      }
    }
    lastUnderlineCount = underlineCount;

    // 主干音符（大于等于一拍），单独成组
    if (nodeTime >= beatValue) {
      if (current.length > 0) {
        groups.push(current);
        current = [];
        acc = 0;
      }
      groups.push([note]);
    } else {
      // 短音符，累计到一拍为一组
      current.push(note);
      acc += nodeTime;
      if (Math.abs(acc - beatValue) < 1e-6) {
        groups.push(current);
        current = [];
        acc = 0;
      } else if (acc > beatValue) {
        // 超过一拍，强制分组
        groups.push(current);
        current = [];
        acc = 0;
      }
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

export class SNBeamLayer {
  private static el: SVGGElement;

  constructor(scoreEl: SVGGElement) {
    SNBeamLayer.el = SvgUtils.createG({ tag: 'beam' });
    scoreEl.appendChild(SNBeamLayer.el);
  }

  /**
   * 绘制所有 measure 的符杠
   */
  static draw(measures: SNMeasure[]) {
    if (SNBeamLayer.el) {
      SNBeamLayer.el.innerHTML = '';
    }
    // 判断乐谱类型，分支绘制
    switch (SNConfig.score.scoreType) {
      case SNScoreType.Simple:
        SNBeamLayer.drawSimpleUnderlines(measures);
        break;
      case SNScoreType.Guitar:
      case SNScoreType.SimpleGuirar:
        SNBeamLayer.drawGuitarBeams(measures);
        break;
      default:
        SNBeamLayer.drawSimpleUnderlines(measures);
        break;
    }
  }

  /**
   * 简谱下划线/beam分组绘制（乐谱标准分组）
   */
  static drawSimpleUnderlines(measures: SNMeasure[]) {
    measures.forEach((measure) => {
      const groups = groupNotesForBeam(measure.notes);
      groups.forEach((group) => {
        SNBeamLayer.drawUnderlineGroup(group, group[0]?.underlineCount ?? 0);
      });
    });
  }

  /**
   * 吉他谱符杠分组绘制（乐谱标准分组）
   */
  static drawGuitarBeams(measures: SNMeasure[]) {
    measures.forEach((measure) => {
      const groups = groupNotesForBeam(measure.notes);
      groups.forEach((group) => {
        SNBeamLayer.drawGuitarBeamGroup(group, group[0]?.underlineCount ?? 0);
      });
    });
  }

  /**
   * 绘制一组简谱下划线
   */
  static drawUnderlineGroup(group: SNNote[], underlineCount: number) {
    if (group.length === 0 || underlineCount === 0) return;
    if (group.length === 1) {
      // 单音符，绘制原样下划线
      const note = group[0];
      const y = note.innerY + SNConfig.score.lineHeight - 13;
      const lineSpacing = 3;
      for (let i = 0; i < underlineCount; i++) {
        SNBeamLayer.el.appendChild(
          SvgUtils.createLine({
            x1: note.innerX + (note.startNote ? 3 : 0),
            y1: y + lineSpacing * i,
            x2: note.innerX - (note.endNote ? 3 : 0) + note.innerWidth,
            y2: y + lineSpacing * i,
            stroke: 'black',
            strokeWidth: 1,
          }),
        );
      }
    } else if (group.length > 1) {
      // 多音符，绘制一条横跨所有音符的下划线
      const first = group[0];
      const last = group[group.length - 1];
      const y = first.innerY + SNConfig.score.lineHeight - 13;
      const lineSpacing = 3;
      for (let i = 0; i < underlineCount; i++) {
        SNBeamLayer.el.appendChild(
          SvgUtils.createLine({
            x1: first.innerX + (first.startNote ? 3 : 0),
            y1: y + lineSpacing * i,
            x2: last.innerX - (last.endNote ? 3 : 0) + last.innerWidth,
            y2: y + lineSpacing * i,
            stroke: 'black',
            strokeWidth: 1,
          }),
        );
      }
    }
  }

  /**
   * 绘制一组吉他谱符杠
   */
  static drawGuitarBeamGroup(group: SNNote[], underlineCount: number) {
    if (group.length === 0 || underlineCount === 0) return;
    const first = group[0];
    const last = group[group.length - 1];
    const lineTop = first.parent!.y + SNConfig.score.chordHeight + 11;
    const lineHeight = (SNConfig.score.lineHeight - 4) / 6;
    const x1 = first.innerX + first.innerWidth / 2;
    const x2 = last.innerX + last.innerWidth / 2;
    const underlineBaseY = lineTop + lineHeight * 5 + 10;
    const lineSpacing = 3;

    // 所有音符都画竖线，只有落单的八分/十六分音符竖线底部加标准小尾巴（斜线+左弧线）
    group.forEach((note) => {
      if (String(note.note) === '0') return; // 跳过休止符
      const { string } = note.getGuitarNotePosition();
      if (string) {
        const x = note.innerX + note.innerWidth / 2;
        const y = lineTop + lineHeight * (string - 1) + lineHeight / 2;
        // 竖线
        SNBeamLayer.el.appendChild(
          SvgUtils.createLine({
            x1: x,
            y1: y,
            x2: x,
            y2: underlineBaseY,
            stroke: 'black',
            strokeWidth: 1.2,
          }),
        );
        // 只有落单的短音符才画标准小尾巴（flag）：只保留斜线，移除弧线
        if (group.length === 1 && note.underlineCount >= 1) {
          for (let i = 0; i < note.underlineCount; i++) {
            const flagY = underlineBaseY - i * 4;
            // 缩短斜线长度为原来的0.8倍
            const dx = 8; // 原10，缩短为8
            const dy = -8; // 原-10，缩短为-8
            const flagStartX = x;
            const flagStartY = flagY;
            const flagEndX = x + dx;
            const flagEndY = flagY + dy;
            const flagPath = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'path',
            );
            const d = `M ${flagStartX} ${flagStartY} L ${flagEndX} ${flagEndY}`;
            flagPath.setAttribute('d', d);
            flagPath.setAttribute('stroke', 'black');
            flagPath.setAttribute('stroke-width', '1.2');
            flagPath.setAttribute('fill', 'none');
            SNBeamLayer.el.appendChild(flagPath);
          }
        }
      }
    });

    // 横向下划线（beam）只在 group.length > 1 时绘制
    if (group.length > 1) {
      for (let i = 0; i < underlineCount; i++) {
        SNBeamLayer.el.appendChild(
          SvgUtils.createLine({
            x1: x1,
            y1: underlineBaseY - lineSpacing * i,
            x2: x2,
            y2: underlineBaseY - lineSpacing * i,
            stroke: 'black',
            strokeWidth: 1,
          }),
        );
      }
    }
  }
}
