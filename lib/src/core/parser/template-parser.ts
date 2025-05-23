import { BaseParser } from './base-parser';
import { SNNoteOptions, SNNoteParserOptions, SNStaveOptions } from '@types';
import { SNRuntime } from '@config';
import { SNConfig } from '@config';

/**
 * 模板解析器实现
 */
export class TemplateParser extends BaseParser {
  /**
   * 解析入口，直接调用parseScore
   * @param data - 原始乐谱数据
   * @returns 解析后的五线谱选项数组
   */
  parse(data: string) {
    return {
      parsedScore: this.parseScore(data),
    };
  }

  /**
   * 解析单个音符的数据
   * @param noteData - 音符的原始字符串数据
   * @returns 解析后的音符信息对象
   */
  parseNote(noteData: string): SNNoteParserOptions {
    const weight = 10;
    let nodeTime = 0;
    let duration = '';
    let upDownCount = 0;
    let octaveCount = 0;
    let underlineCount = 0;
    let isTieStart = false;
    let isTieEnd = false;
    let graceNotes: SNNoteParserOptions['graceNotes'] = [];
    let chord: string | undefined = undefined;
    let durationNum = 4; // 默认四分音符

    const chordRegex = /^\{([^}]+)\}/;
    const chordMatch = noteData.match(chordRegex);
    if (chordMatch) {
      chord = chordMatch[1];
      noteData = noteData.replace(chordRegex, '');
      if (SNConfig.score && SNConfig.score.chordHeight === 0) {
        SNConfig.score.chordHeight = 10;
      }
    }

    const graceNoteRegex = /<([^>]+)>/g;
    const graceNotesMatch = graceNoteRegex.exec(noteData);
    if (graceNotesMatch && graceNotesMatch[1]) {
      const graceNotesData = graceNotesMatch[1].split(',');
      graceNotes = graceNotesData.map((graceNoteData) => {
        const { note, upDownCount, octaveCount, underlineCount, duration } =
          this.parseNote(graceNoteData);
        return {
          note,
          upDownCount,
          octaveCount,
          underlineCount,
          isError: false,
          duration,
        };
      });
      noteData = noteData.replace(graceNoteRegex, '');
    }

    if (noteData.startsWith('[')) {
      isTieStart = true;
      noteData = noteData.slice(1);
    }
    if (noteData.endsWith(']')) {
      isTieEnd = true;
      noteData = noteData.slice(0, -1);
    }

    const regex =
      /(?<leftBracket>\()?(?<accidental>[#b]{0,})(?<note>\d|-)(?<duration>\/(2|4|8|16|32))?(?<delay>\.)?(?<octave>[\^_]*)?(?<rightBracket>\))?/;
    const match = noteData.match(regex);
    if (match && match.groups) {
      const {
        leftBracket,
        accidental,
        note,
        duration: durationMatch,
        delay,
        octave,
        rightBracket,
      } = match.groups;
      if (accidental) {
        const upCount = (accidental.match(/#/g) || []).length;
        const downCount = (accidental.match(/b/g) || []).length;
        upDownCount = upCount - downCount;
      }
      if (durationMatch) {
        duration = durationMatch.substring(1);
        switch (duration) {
          case '2':
            durationNum = 2;
            nodeTime = 2;
            break;
          case '8':
            durationNum = 8;
            nodeTime = 0.5;
            underlineCount = 1;
            break;
          case '16':
            durationNum = 16;
            nodeTime = 0.25;
            underlineCount = 2;
            break;
          case '32':
            durationNum = 32;
            nodeTime = 0.125;
            underlineCount = 3;
            break;
          default:
            durationNum = 4;
            nodeTime = 1;
            break;
        }
      } else {
        durationNum = 4;
        nodeTime = 1;
      }
      if (delay) {
        nodeTime *= 1.5;
      }
      if (upDownCount !== 0 && ['0', '-'].includes(note)) {
        upDownCount = 0;
      }
      if (octave) {
        const upOctave = (octave.match(/\^/g) || []).length;
        const downOctave = (octave.match(/_/g) || []).length;
        octaveCount = upOctave - downOctave;
      }
      const newNode =
        (leftBracket || '') + note + (delay || '') + (rightBracket || '');
      return {
        weight,
        nodeTime,
        note: newNode,
        underlineCount,
        upDownCount,
        octaveCount,
        isTieStart,
        isTieEnd,
        graceNotes,
        isError: false,
        chord,
        duration: durationNum,
      };
    }
    return {
      weight,
      nodeTime,
      note: noteData,
      underlineCount,
      upDownCount: 0,
      octaveCount: 0,
      isTieStart,
      isTieEnd,
      graceNotes,
      isError: false,
      chord,
      duration: durationNum,
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
    const notes = measureData.split(/,(?![^<>]*>)/);
    let weight = 0;
    const noteOptions: SNNoteOptions[] = [];
    const notesLenth = notes.length;
    let totalTime = 0;
    let exceed = false;
    for (let index = 0; index < notesLenth; index++) {
      const noteData = notes[index];
      const {
        weight: noteWeight,
        nodeTime,
        note,
        underlineCount,
        upDownCount,
        octaveCount,
        isTieStart,
        isTieEnd,
        graceNotes,
        chord,
        duration,
      } = this.parseNote(noteData);
      const startNote = totalTime % 1 == 0;
      weight += noteWeight;
      const willTotal = totalTime + nodeTime;
      const isError = willTotal > expectedBeats;
      if (isError) exceed = true;
      totalTime = willTotal;
      const endNote = totalTime % 1 == 0;
      noteOptions.push({
        index: noteCount + index + 1,
        note,
        weight: noteWeight,
        noteData,
        startNote,
        endNote,
        underlineCount,
        upDownCount,
        octaveCount,
        isTieStart,
        isTieEnd,
        graceNotes,
        isError,
        chord,
        x: 0,
        width: 0,
        duration,
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
    };
    let tempWeight = 0;
    const rawMeasures = stave.trim().split(/\|/);
    rawMeasures.forEach((raw) => {
      let measureData = raw.trim();
      if (measureData === '') return;
      let repeatStart = false;
      let repeatEnd = false;
      if (measureData.startsWith(':')) {
        repeatStart = true;
        measureData = measureData.replace(/^:\|?/, '');
      }
      if (measureData.endsWith(':')) {
        repeatEnd = true;
        measureData = measureData.replace(/\|?:$/, '');
      }
      if (measureData.startsWith(':') && measureData.endsWith(':')) {
        repeatStart = true;
        repeatEnd = true;
        measureData = measureData.replace(/^:\|?/, '').replace(/\|?:$/, '');
      }
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
    let noteCount = 0;
    let measureCount = 0;
    const staveOptions: SNStaveOptions[] = [];
    const expectedBeats = Number(SNRuntime.info.beat) || 4;
    scoreData.split('\n').forEach((stave) => {
      const {
        staveOption,
        noteCount: newNoteCount,
        measureCount: newMeasureCount,
      } = this.parseStave(stave, noteCount, measureCount, expectedBeats);
      noteCount = newNoteCount;
      measureCount = newMeasureCount;
      staveOptions.push(staveOption);
    });
    return staveOptions;
  }
}
