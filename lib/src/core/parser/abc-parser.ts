import { BaseParser } from './base-parser';
import {
  SNAbcKey,
  SNData,
  SNDataInfo,
  SNNoteOptions,
  SNNoteParserOptions,
  SNStaveOptions,
} from '@types';
import { SNConfig } from '@config';

/**
 * ABC解析器实现，功能与模板解析器一致，但独立实现
 */
export class AbcParser extends BaseParser {
  private info: SNDataInfo = {
    title: '',
    composer: '',
    lyricist: '',
    beat: '',
    time: '',
    key: undefined,
    tempo: '',
  };
  // 最短时值——L
  private L = 0;

  /**
   * 解析ABC乐谱字符串，仅支持模板语法中存在的功能
   * @param abcScore - ABC乐谱字符串
   * @returns 解析后的乐谱数据对象
   */
  parse(data: SNData): {
    parsedScore: SNStaveOptions[];
    info?: SNDataInfo;
    lyric?: string;
    score?: string;
  } {
    const scoreLines: string[] = [];
    const lines = (data as string).split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^T:/.test(trimmed)) {
        this.info.title = trimmed.replace(/^T:/, '').trim();
      } else if (/^M:/.test(trimmed)) {
        // 解析M字段，如3/8，分子为beat，分母为time
        const mValue = trimmed.replace(/^M:/, '').trim();
        const match = mValue.match(/^(\d+)\/(\d+)$/);
        if (match) {
          this.info.beat = match[1];
          this.info.time = match[2];
        } else {
          this.info.beat = '';
          this.info.time = '';
        }
      } else if (/^K:/.test(trimmed)) {
        this.info.key = trimmed.replace(/^K:/, '').trim() as SNAbcKey;
      } else if (/^Q:/.test(trimmed)) {
        // 解析Q字段，支持如1/4=120格式，tempo应换算为每分钟L音符数，全部以info.time为基准
        const qValue = trimmed.replace(/^Q:/, '').trim();
        // 匹配如 1/4=120 或 120
        const match = qValue.match(/^(\d+\/\d+)\s*=\s*(\d+)$/);
        if (match) {
          const noteType = match[1]; // 如1/4
          const bpm = parseInt(match[2], 10); // 速度
          // 计算Q音符的nodeTime，全部以info.time为基准
          const timeDenominator =
            parseInt(this.info.time ? this.info.time : '4', 10) || 4;
          // Q音符nodeTime
          const noteMatch = noteType.match(/^(\d+)\/(\d+)$/);
          let qNodeTime = 1;
          let qNumerator = 1,
            qDenominator = 4;
          if (noteMatch) {
            qNumerator = parseInt(noteMatch[1], 10);
            qDenominator = parseInt(noteMatch[2], 10);
            qNodeTime = (timeDenominator / qDenominator) * qNumerator;
          }
          // 如果Q的音符类型等于一拍（四分音符=1），tempo直接等于bpm，否则换算为每分钟一拍数
          const quarterNoteTime = 4 / timeDenominator;
          if (qNodeTime === quarterNoteTime) {
            this.info.tempo = bpm.toString();
          } else {
            // tempo应为每分钟一拍数 = bpm * (qNodeTime / quarterNoteTime)
            const tempo = Math.round(bpm * (qNodeTime / quarterNoteTime));
            this.info.tempo = tempo.toString();
          }
        }
      } else if (/^L:/.test(trimmed)) {
        // 解析L字段，最短时值，如1/8，结合info.time计算nodeTime
        const lValue = trimmed.replace(/^L:/, '').trim();
        const match = lValue.match(/^(\d+)\/(\d+)$/);
        if (match) {
          const lNumerator = parseInt(match[1], 10);
          const lDenominator = parseInt(match[2], 10);
          const timeDenominator =
            parseInt(this.info.time ? this.info.time : '4', 10) || 4; // 默认4分音符为一拍
          // L的nodeTime = (time/L分母)*L分子
          this.L = (timeDenominator / lDenominator) * lNumerator;
        } else {
          this.L = 1;
        }
      } else if (/^[A-Z]:/.test(trimmed)) {
        // 其它头部信息暂不处理
        continue;
      } else if (trimmed) {
        scoreLines.push(trimmed);
      }
    }
    const scoreStr = scoreLines.join('\n');
    const parsedScore = this.parseScore(scoreStr);
    return {
      parsedScore,
      info: this.info,
      score: scoreStr,
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
          isError: false,
          duration,
          nodeTime,
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

    // abc字母音符到简谱数字的映射（C调）
    const abcToJianpu: Record<string, string> = {
      C: '1',
      D: '2',
      E: '3',
      F: '4',
      G: '5',
      A: '6',
      B: '7',
      c: '1',
      d: '2',
      e: '3',
      f: '4',
      g: '5',
      a: '6',
      b: '7',
    };
    // 处理abc音符（A-G/a-g），支持前缀和弦
    const abcRegex =
      /^(?<accidental>\^+|_+|=+)?(?<chord>"[^"]+")?(?<note>[A-Ga-g])(?<octave>[',]*)?(?<duration>\d+)?(?<dot>\.)?$/;
    const abcMatch = noteData.match(abcRegex);
    if (abcMatch && abcMatch.groups) {
      const {
        accidental,
        chord: chordStr,
        note,
        octave,
        duration,
        dot,
      } = abcMatch.groups;
      const jianpu = abcToJianpu[note];
      // 升降号处理
      if (accidental) {
        if (accidental.includes('^')) upDownCount = accidental.length;
        if (accidental.includes('_')) upDownCount = -accidental.length;
        // 还原号暂不处理
      }
      // 和弦处理
      if (chordStr) {
        chord = chordStr.slice(1, -1); // 去除双引号
      }
      // 八度处理
      if (octave) {
        // ' 表示升八度，, 表示降八度
        const up = (octave.match(/'/g) || []).length;
        const down = (octave.match(/,/g) || []).length;
        octaveCount = up - down;
        // 小写本身高八度
        if (note >= 'a' && note <= 'g') octaveCount += 1;
      } else {
        if (note >= 'a' && note <= 'g') octaveCount = 1;
      }
      let d = 1;
      if (duration) {
        d = parseInt(duration);
      }
      switch (d) {
        case 1:
          nodeTime = this.L;
          durationNum = 4 / this.L;
          break;
        case 2:
          nodeTime = this.L * 2;
          durationNum = 4 / (this.L * 2);
          break;
        case 4:
          nodeTime = this.L * 4;
          durationNum = 4 / (this.L * 4);
          break;
        case 8:
          nodeTime = this.L * 8;
          durationNum = 4 / (this.L * 8);
          break;
        case 16:
          nodeTime = this.L * 16;
          durationNum = 4 / (this.L * 16);
          break;
        case 32:
          nodeTime = this.L * 32;
          durationNum = 4 / (this.L * 32);
          break;
        default:
          nodeTime = this.L;
          durationNum = 4 / this.L;
          break;
      }
      if (dot) {
        nodeTime *= 1.5;
      }
      // underlineCount根据nodetime与一拍（四分音符=1）关系判断
      const timeDenominator =
        parseInt(this.info.time ? this.info.time : '4', 10) || 4;
      const quarterNoteTime = 4 / timeDenominator; // 一拍的nodeTime
      if (nodeTime >= quarterNoteTime * 2) underlineCount = 0;
      else if (nodeTime >= quarterNoteTime) underlineCount = 0;
      else if (nodeTime >= quarterNoteTime / 2) underlineCount = 1;
      else if (nodeTime >= quarterNoteTime / 4) underlineCount = 2;
      else if (nodeTime >= quarterNoteTime / 8) underlineCount = 3;
      else underlineCount = 0;
      return {
        weight,
        nodeTime,
        note: jianpu,
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
    // 按abc音符切割，支持前缀修饰符、和弦（双引号包围）
    // 匹配如 ^C, _D, "Am"E, F2, G, a, b, 等
    const noteRegex = /((?:\^+|_+|=+)?(?:"[^"]+")?[A-Ga-g][',]*\d*\.?)/g;
    const notes = [];
    let match;
    while ((match = noteRegex.exec(measureData)) !== null) {
      notes.push(match[0]);
    }
    let weight = 0;
    const noteOptions: SNNoteOptions[] = [];
    const notesLenth = notes.length;
    let totalTime = 0;
    let exceed = false;
    let isError = false;
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
        nodeTime,
      });
      isError = willTotal > expectedBeats;
      if (isError) exceed = true;
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
    const rawMeasures = stave
      .trim()
      .split(/\|/)
      .filter((m) => m.trim() !== '');
    rawMeasures.forEach((raw) => {
      let measureData = raw.trim();
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
    const expectedBeats = Number(this.info.beat) || 4;
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
