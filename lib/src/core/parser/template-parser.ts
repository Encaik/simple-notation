import { BaseParser } from './base-parser';
import {
  SNNoteOptions,
  SNStaveOptions,
  SNDataInfo,
  SNGraceNoteOptions,
  SNMultiNoteOptions,
  SNStaveType,
} from '@types';
import { SNConfig, SNRuntime } from '@config';

/**
 * 模板解析器实现
 */
export class TemplateParser extends BaseParser {
  /** 当前处理的文本位置 */
  private currentPosition: number = 0;

  /**
   * 解析入口，直接调用parseScore
   * @param data - 原始乐谱数据
   * @returns 解析后的五线谱选项数组
   */
  parse(data: string): {
    parsedScore: SNStaveOptions[];
    info?: SNDataInfo;
    lyric?: string;
    score?: string;
  } {
    return {
      parsedScore: this.parseScore(data),
    };
  }

  /**
   * 解析单个音符的数据
   * @param noteData - 音符的原始字符串数据
   * @returns 解析后的音符信息对象
   */
  parseNote(noteData: string): SNNoteOptions {
    let weight = 10; // 默认权重
    let nodeTime = 0;
    let duration = '';
    let upDownCount = 0;
    let octaveCount = 0;
    let underlineCount = 0;
    let isDelay = false;
    let isTieStart = false;
    let isTieEnd = false;
    let graceNotes: SNGraceNoteOptions[] = [];
    const chord: string[] = [];
    let durationNum = 4; // 默认四分音符
    let multiNotes: SNMultiNoteOptions[] = []; // 多音标记

    // #region 处理和弦
    const chordRegexGlobal = /\{([^}]+)\}/g;
    let chordMatch;
    while ((chordMatch = chordRegexGlobal.exec(noteData)) !== null) {
      chord.push(chordMatch[1]);
    }
    noteData = noteData.replace(chordRegexGlobal, '');
    if (
      chord.length > 0 &&
      SNConfig.score &&
      SNConfig.score.chordHeight === 0
    ) {
      SNConfig.score.chordHeight = 13;
    }
    // #endregion

    // #region 处理装饰音
    const graceNoteRegex = /<([^>]+)>/g;
    const graceNotesMatch = graceNoteRegex.exec(noteData);
    if (graceNotesMatch && graceNotesMatch[1]) {
      const graceNotesData = graceNotesMatch[1].split(',');
      graceNotes = graceNotesData.map((graceNoteData) => {
        const {
          note,
          upDownCount,
          octaveCount,
          underlineCount,
          duration,
          nodeTime,
        } = this.parseNote(graceNoteData);
        return {
          note,
          upDownCount,
          octaveCount,
          underlineCount,
          duration,
          nodeTime,
        };
      });
      noteData = noteData.replace(graceNoteRegex, '');
    }
    // #endregion

    // #region 处理连音
    if (noteData.startsWith('[')) {
      isTieStart = true;
      noteData = noteData.slice(1);
    }
    if (noteData.endsWith(']')) {
      isTieEnd = true;
      noteData = noteData.slice(0, -1);
    }
    // #endregion

    // #region 解析音符
    const regex =
      /(?<leftBracket>\()?(?<accidental>[#b]{0,})(?<note>\d|-)(?<duration>\/(2|4|8|16|32))?(?<delay>\.)?(?<octave>[\^_]*)?(?<multinote>(-.*){0,})?(?<rightBracket>\))?/;
    const match = noteData.match(regex);
    if (match && match.groups) {
      const {
        accidental,
        note,
        duration: durationMatch,
        delay,
        octave,
        multinote,
      } = match.groups;
      // #region 计算升降号
      if (accidental) {
        const upCount = (accidental.match(/#/g) || []).length;
        const downCount = (accidental.match(/b/g) || []).length;
        upDownCount = upCount - downCount;
        // 有升降号权重+1
        if (upCount > 0 || downCount > 0) {
          weight += 1;
        }
      }
      // #endregion
      // #region 计算时值和权重
      if (durationMatch) {
        duration = durationMatch.substring(1);
        switch (duration) {
          case '2':
            durationNum = 2;
            nodeTime = 2;
            weight = 10; // 二分音符权重
            break;
          case '8':
            durationNum = 8;
            nodeTime = 0.5;
            underlineCount = 1;
            weight = 8; // 八分音符权重
            break;
          case '16':
            durationNum = 16;
            nodeTime = 0.25;
            underlineCount = 2;
            weight = 6.4; // 十六分音符权重
            break;
          case '32':
            durationNum = 32;
            nodeTime = 0.125;
            underlineCount = 3;
            weight = 5.6; // 三十二分音符权重
            break;
          default:
            durationNum = 4;
            nodeTime = 1;
            weight = 10; // 默认四分音符权重
            break;
        }
      } else {
        durationNum = 4;
        nodeTime = 1;
        weight = 10; // 默认四分音符权重
      }
      if (delay) {
        // #endregion
        // #region 计算附点
        nodeTime *= 1.5;
        weight += 1; // 有附点权重+1
        isDelay = true;
      }
      // #endregion
      // #region 计算下划线
      if (upDownCount !== 0 && ['0', '-'].includes(note)) {
        upDownCount = 0;
      }
      // #endregion
      // #region 计算八度
      if (octave) {
        const upOctave = (octave.match(/\^/g) || []).length;
        const downOctave = (octave.match(/_/g) || []).length;
        octaveCount = upOctave - downOctave;
      }
      // #endregion
      // #region 处理多音
      if (multinote) {
        multiNotes = multinote
          .split('-')
          .slice(1)
          .map((n) => {
            const { note, upDownCount, octaveCount } = this.parseNote(n);
            return {
              note,
              upDownCount,
              octaveCount,
            };
          });
      }
      // #endregion
      return {
        noteData,
        weight,
        nodeTime,
        note,
        underlineCount,
        upDownCount,
        octaveCount,
        isDelay,
        isTieStart,
        isTieEnd,
        graceNotes,
        multiNotes,
        isError: false,
        chord,
        duration: durationNum,
        hasLeftBracket: noteData.trim().startsWith('('),
        hasRightBracket: noteData.trim().endsWith(')'),
      };
    }
    // #endregion

    return {
      noteData,
      weight,
      nodeTime,
      note: noteData,
      underlineCount,
      upDownCount: 0,
      octaveCount: 0,
      isDelay,
      isTieStart,
      isTieEnd,
      graceNotes,
      multiNotes,
      isError: false,
      chord,
      duration: durationNum,
      hasLeftBracket: false,
      hasRightBracket: false,
    };
  }

  /**
   * 解析单个小节的数据
   * @param measureData - 小节的原始字符串数据
   * @param noteCount - 当前已处理的音符总数
   * @param expectedBeats - 当前小节应有的拍数（用于时值校验）
   * @returns 解析后的小节信息对象
   */
  parseMeasure(measureData: string, noteCount: number, expectedBeats: number) {
    // #region 处理三连音
    const tripletRegex = /3\(([^)]*)\)/g;
    let match: RegExpExecArray | null;
    const tripletGroups: { start: number; end: number; notes: string[] }[] = [];
    // 先找出所有三连音片段及其位置
    while ((match = tripletRegex.exec(measureData)) !== null) {
      const notes = match[1].split(',');
      tripletGroups.push({
        start: match.index,
        end: match.index + match[0].length,
        notes,
      });
    }
    // 组装三连音和普通音符的平铺数组
    const tripletFlatNotes: {
      note: string;
      isTriplet: boolean;
      tripletGroupStart?: boolean;
      tripletGroupEnd?: boolean;
    }[] = [];
    if (tripletGroups.length > 0) {
      let cursor = 0;
      tripletGroups.forEach((group) => {
        // 先加前面的普通音符
        const before = measureData.slice(cursor, group.start);
        if (before) {
          before.split(/,(?![^<>]*>)/).forEach((n) => {
            if (n.trim() !== '') {
              tripletFlatNotes.push({ note: n.trim(), isTriplet: false });
            }
          });
        }
        // 加三连音音符，并标记首尾
        group.notes.forEach((n, i) => {
          if (n.trim() !== '') {
            tripletFlatNotes.push({
              note: n.trim(),
              isTriplet: true,
              tripletGroupStart: i === 0,
              tripletGroupEnd: i === group.notes.length - 1,
            });
          }
        });
        cursor = group.end;
      });
      // 末尾剩余
      const after = measureData.slice(cursor);
      if (after) {
        after.split(/,(?![^<>]*>)/).forEach((n) => {
          if (n.trim() !== '') {
            tripletFlatNotes.push({ note: n.trim(), isTriplet: false });
          }
        });
      }
    } else {
      // 没有三连音，按原有逻辑分割
      measureData.split(/,(?![^<>]*>)/).forEach((n) => {
        if (n.trim() !== '') {
          tripletFlatNotes.push({ note: n.trim(), isTriplet: false });
        }
      });
    }
    // #endregion

    let weight = 0;
    const noteOptions: SNNoteOptions[] = [];
    const notesLenth = tripletFlatNotes.length;
    let totalTime = 0;
    let exceed = false;

    for (let index = 0; index < notesLenth; index++) {
      const noteData = tripletFlatNotes[index].note;
      const isTriplet = tripletFlatNotes[index].isTriplet;
      const tripletGroupStart = tripletFlatNotes[index].tripletGroupStart;
      const tripletGroupEnd = tripletFlatNotes[index].tripletGroupEnd;
      const {
        weight: noteWeight,
        nodeTime,
        note,
        underlineCount,
        upDownCount,
        octaveCount,
        isDelay,
        isTieStart,
        isTieEnd,
        graceNotes,
        multiNotes,
        chord,
        duration,
        isError,
        hasLeftBracket,
        hasRightBracket,
      } = this.parseNote(noteData);

      // #region 计算音符时值
      const startNote = totalTime % 1 == 0;
      weight += isTriplet ? noteWeight * 0.7 : noteWeight;
      let realNodeTime = nodeTime;
      if (isTriplet) {
        realNodeTime = (nodeTime * 2) / 3;
      }
      let willTotal = totalTime;
      if (isTriplet && tripletGroupStart) {
        // 三连音组首音，累计2拍
        willTotal += nodeTime * 2;
      } else if (!isTriplet) {
        // 普通音符正常累计
        willTotal += nodeTime;
      }
      const errorFlag = willTotal > expectedBeats;
      if (errorFlag) exceed = true;
      totalTime = willTotal;
      const endNote = totalTime % 1 == 0;
      // #endregion

      // #region 计算音符在原始文本中的位置
      const noteStartPos = this.currentPosition;
      const noteEndPos = noteStartPos + noteData.length;
      this.currentPosition = noteEndPos + 1; // +1 for逗号或分隔符
      // #endregion

      noteOptions.push({
        index: noteCount + index + 1,
        note,
        weight: isTriplet ? noteWeight * 0.7 : noteWeight,
        noteData,
        startNote,
        endNote,
        underlineCount,
        upDownCount,
        octaveCount,
        isDelay,
        isTieStart,
        isTieEnd,
        graceNotes,
        multiNotes,
        isError: errorFlag || isError || false,
        chord,
        x: 0,
        width: 0,
        duration,
        nodeTime: realNodeTime,
        startPosition: noteStartPos,
        endPosition: noteEndPos,
        isTriplet,
        tripletGroupStart,
        tripletGroupEnd,
        hasLeftBracket,
        hasRightBracket,
      });
    }
    if (!exceed && totalTime < expectedBeats) {
      noteOptions.forEach((n) => (n.isError = true));
    }
    return { weight, measureNoteCount: noteCount + notesLenth, noteOptions };
  }

  /**
   * 解析单个乐句中的小节数据并添加到五线谱选项中
   * @param stave - 单个乐句的原始字符串数据
   * @param noteCount - 当前已处理的音符总数
   * @param measureCount - 当前已处理的小节总数
   * @param expectedBeats - 当前小节应有的拍数（用于时值校验）
   * @param staveStartPos - 当前乐句的起始位置
   * @returns 解析后的小节信息和更新后的音符、小节总数
   */
  parseStave(
    stave: string,
    noteCount: number,
    measureCount: number,
    expectedBeats: number,
  ) {
    const staveOption: SNStaveOptions = {
      index: 0,
      weight: 0,
      measureOptions: [],
      y: 0,
      endLine: false,
      type: SNStaveType.DefaultLine,
    };
    let _stave = stave;
    if (_stave.startsWith('!')) {
      _stave = _stave.replace('!', '');
      staveOption.type = SNStaveType.ChordLine;
    }
    let tempWeight = 0;
    const rawMeasures = stave
      .trim()
      .split(/\|/)
      .filter((m) => m.trim() !== '');

    rawMeasures.forEach((raw) => {
      let measureData = raw.trim();

      // #region 处理小节循环标记
      let repeatStart = false;
      let repeatEnd = false;
      if (measureData.startsWith(':')) {
        repeatStart = true;
        measureData = measureData.replace(/^:\|?/, '');
        this.currentPosition++;
      }
      if (measureData.endsWith(':')) {
        repeatEnd = true;
        measureData = measureData.replace(/\|?:$/, '');
        this.currentPosition++;
      }
      if (measureData.startsWith(':') && measureData.endsWith(':')) {
        repeatStart = true;
        repeatEnd = true;
        measureData = measureData.replace(/^:\|?/, '').replace(/\|?:$/, '');
        this.currentPosition += 2;
      }
      // #endregion

      const { weight, measureNoteCount, noteOptions } = this.parseMeasure(
        measureData,
        noteCount,
        expectedBeats,
      );
      tempWeight += weight;
      noteCount = measureNoteCount;
      staveOption.measureOptions.push({
        index: measureCount++,
        measureData,
        weight,
        noteOptions: noteOptions,
        repeatStart,
        repeatEnd,
        x: 0,
        width: 0,
      });
    });
    staveOption.weight = tempWeight;
    return { staveOption, noteCount, measureCount };
  }

  /**
   * 解析完整的谱面数据
   * @param scoreData - 谱面的原始字符串数据
   * @returns 解析后的五线谱选项数组
   */
  parseScore(scoreData: string): SNStaveOptions[] {
    this.currentPosition = 0; // 每次解析新乐谱时重置全局游标
    let noteCount = 0;
    let measureCount = 0;
    const staveOptions: SNStaveOptions[] = [];
    const expectedBeats = Number(SNRuntime.info.time) || 4;

    scoreData.split('\n').forEach((stave) => {
      if (stave.startsWith('|')) {
        this.currentPosition++;
      }
      const {
        staveOption,
        noteCount: newNoteCount,
        measureCount: newMeasureCount,
      } = this.parseStave(stave, noteCount, measureCount, expectedBeats);
      noteCount = newNoteCount;
      measureCount = newMeasureCount;
      staveOptions.push(staveOption);
      if (stave.endsWith('|')) {
        this.currentPosition++;
      }
    });
    return staveOptions;
  }
}
