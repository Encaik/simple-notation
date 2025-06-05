import { SvgUtils } from '@utils';
import { SNConfig } from '@config';
import { SNScoreType } from '@types';
import { SNMeasure } from '@components';
import { SNNote } from '../components/note';
import { SNRuntime } from '@config';
import { BravuraMusicSymbols } from '@utils';

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
    const lineTop = first.parent!.y + SNConfig.score.chordHeight + 11;
    const lineHeight = (SNConfig.score.lineHeight - 4) / 6;
    const underlineBaseY = lineTop + lineHeight * 6 + 13;
    const lineSpacing = 3;

    // 所有音符都画竖线，只有落单的八分/十六分音符竖线底部加标准小尾巴（斜线+左弧线）
    group.forEach((note) => {
      const { string } = note.getGuitarNotePosition();
      // 如果是休止符，绘制对应的休止符符号并跳过后续绘制（不依赖string）
      if (String(note.note) === '0') {
        let restSymbolKey: keyof typeof BravuraMusicSymbols.SYMBOLS | undefined;
        // 根据nodeTime选择休止符符号
        switch (note.nodeTime) {
          case 4: // 全休止符
            restSymbolKey = 'REST_WHOLE';
            break;
          case 2: // 二分休止符
            restSymbolKey = 'REST_HALF';
            break;
          case 1: // 四分休止符
            restSymbolKey = 'REST_QUARTER';
            break;
          case 0.5: // 八分休止符
            restSymbolKey = 'REST_EIGHTH';
            break;
          case 0.25: // 十六分休止符
            restSymbolKey = 'REST_SIXTEENTH';
            break;
          case 0.125: // 三十二分休止符
            restSymbolKey = 'REST_32ND';
            break;
          default:
            // 默认四分休止符
            restSymbolKey = 'REST_QUARTER';
            break;
        }
        if (restSymbolKey) {
          const x = note.innerX + note.innerWidth / 2; // 获取音符的中心x坐标
          // 绘制休止符符号，位置需要微调
          SNBeamLayer.el.appendChild(
            BravuraMusicSymbols.createSymbol(restSymbolKey, {
              x: x, // 水平居中
              y: lineTop + lineHeight * 3 + 5, // 垂直位置，大约在六线谱中间位置
              fontSize: 20, // 适当放大
              fontFamily: 'Bravura', // 使用Bravura字体
              textAnchor: 'middle', // 水平居中对齐
            }),
          );
        }
        return; // 跳过当前休止符的后续绘制（竖线和符尾）
      }
      if (string) {
        const x = note.innerX + note.innerWidth / 2;
        const y = lineTop + lineHeight * (string - 1) + lineHeight / 2;
        // 如果是休止符，绘制对应的休止符符号并跳过后续绘制
        if (String(note.note) === '0') {
          let restSymbolKey:
            | keyof typeof BravuraMusicSymbols.SYMBOLS
            | undefined;
          // 根据nodeTime选择休止符符号
          switch (note.nodeTime) {
            case 4: // 全休止符
              restSymbolKey = 'REST_WHOLE';
              break;
            case 2: // 二分休止符
              restSymbolKey = 'REST_HALF';
              break;
            case 1: // 四分休止符
              restSymbolKey = 'REST_QUARTER';
              break;
            case 0.5: // 八分休止符
              restSymbolKey = 'REST_EIGHTH';
              break;
            case 0.25: // 十六分休止符
              restSymbolKey = 'REST_SIXTEENTH';
              break;
            case 0.125: // 三十二分休止符
              restSymbolKey = 'REST_32ND';
              break;
            default:
              // 默认四分休止符
              restSymbolKey = 'REST_QUARTER';
              break;
          }
          if (restSymbolKey) {
            // 绘制休止符符号，位置需要微调
            SNBeamLayer.el.appendChild(
              BravuraMusicSymbols.createSymbol(restSymbolKey, {
                x: x, // 水平居中
                y: lineTop + lineHeight * 3 + 5, // 垂直位置，大约在六线谱中间位置
                fontSize: 20, // 适当放大
                fontFamily: 'Bravura', // 使用Bravura字体
                textAnchor: 'middle', // 水平居中对齐
              }),
            );
          }
          return; // 跳过当前休止符的后续绘制
        }
        // 竖线
        SNBeamLayer.el.appendChild(
          SvgUtils.createLine({
            x1: x,
            y1: y,
            x2: x,
            y2: underlineBaseY, // 使用调整后的竖线终点Y坐标
            stroke: 'black',
            strokeWidth: 1.2,
          }),
        );
        // 只有落单的短音符才画标准小尾巴（flag）：使用Bravura乐谱符号替代原斜线
        if (group.length === 1 && note.underlineCount >= 1) {
          /**
           * 使用Bravura乐谱符号绘制小尾巴，
           * 八分音符用SMuFL标准符号（如Eighth Note Flag），十六分音符及以上用Sixteenth Note Flag。
           * 这样视觉更接近标准乐谱，且跨平台兼容性好。
           */
          const flagSymbol = note.underlineCount === 1 ? 'FLAG_1' : 'FLAG_2';
          const flag = BravuraMusicSymbols.createSymbol(flagSymbol, {
            x: x,
            y: underlineBaseY + 16,
            fontSize: 16,
            fontFamily: 'Bravura',
          });
          flag.setAttribute(
            'transform',
            `scale(1,-1) translate(0,${-2 * (underlineBaseY + 8)})`,
          );
          SNBeamLayer.el.appendChild(flag);
        }
      }
    });

    // 横向下划线（beam）只在 group.length > 1 且组内包含非休止符时绘制
    const nonRestNotes = group.filter((note) => String(note.note) !== '0');
    if (nonRestNotes.length > 1) {
      // 找到第一个和最后一个非休止符音符
      const firstNonRest = nonRestNotes[0];
      // 使用最后一个非休止符的中心X坐标作为梁的结束点
      const beamX2 =
        nonRestNotes[nonRestNotes.length - 1].innerX +
        nonRestNotes[nonRestNotes.length - 1].innerWidth / 2;
      // 使用第一个非休止符的underlineCount来确定梁的数量
      const beamUnderlineCount = firstNonRest.underlineCount;

      for (let i = 0; i < beamUnderlineCount; i++) {
        SNBeamLayer.el.appendChild(
          SvgUtils.createLine({
            x1: firstNonRest.innerX + firstNonRest.innerWidth / 2,
            y1: underlineBaseY - lineSpacing * i, // 梁的Y坐标与竖线终点对齐
            x2: beamX2,
            y2: underlineBaseY - lineSpacing * i,
            stroke: 'black',
            strokeWidth: 1,
          }),
        );
      }
    }
  }
}
