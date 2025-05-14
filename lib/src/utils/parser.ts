import {
  SNGraceNoteOptions,
  SNMeasureOptions,
  SNNoteOptions,
  SNNoteParserOptions,
  SNStaveOptions,
  SNDataInfo,
} from '@types';

/**
 * 解析单个音符的数据
 *
 * @param noteData - 音符的原始字符串数据
 * @returns 解析后的音符信息对象
 */
export function parseNote(noteData: string): SNNoteParserOptions {
  let weight = 10;
  let nodeTime = 0;
  let duration = '';
  let upDownCount = 0; // 记录升降号数量
  let octaveCount = 0; // 记录八度升降数量
  let underlineCount = 0;
  let isTieStart = false;
  let isTieEnd = false;
  let graceNotes: SNGraceNoteOptions[] = []; // 存储装饰音

  const graceNoteRegex = /<([^>]+)>/g;
  const graceNotesMatch = graceNoteRegex.exec(noteData);

  if (graceNotesMatch && graceNotesMatch[1]) {
    const graceNotesData = graceNotesMatch[1].split(',');
    graceNotes = graceNotesData.map((graceNoteData) => {
      const { note, upDownCount, octaveCount, underlineCount } =
        parseNote(graceNoteData);
      return {
        note,
        upDownCount,
        octaveCount,
        underlineCount,
      };
    });
    noteData = noteData.replace(graceNoteRegex, '');
  }

  // 再处理中括号
  if (noteData.startsWith('[')) {
    isTieStart = true;
    noteData = noteData.slice(1);
  }

  if (noteData.endsWith(']')) {
    isTieEnd = true;
    noteData = noteData.slice(0, -1);
  }

  const regex =
    /(?<leftBracket>\()?(?<accidental>[#b]{0,})(?<note>\d|-)(?<duration>\/(2|4|8|16|32))?(?<delay>\.)?(?<octave>[\^_]*)(?<rightBracket>\))?/;
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
    }

    if (duration) {
      switch (duration) {
        case '2':
          underlineCount = 0;
          nodeTime += 2;
          break;
        case '8':
          underlineCount = 1;
          nodeTime += 0.5;
          weight *= 0.8;
          break;
        case '16':
          underlineCount = 2;
          nodeTime += 0.25;
          weight *= 0.7;
          break;
        case '32':
          underlineCount = 3;
          nodeTime += 0.125;
          weight *= 0.6;
          break;
        default:
          underlineCount = 0;
          nodeTime += 1;
          break;
      }
    } else {
      nodeTime += 1;
    }

    if (upDownCount !== 0 && ['0', '-'].includes(note)) {
      upDownCount = 0;
    }

    if (octave) {
      const upOctave = (octave.match(/\^/g) || []).length;
      const downOctave = (octave.match(/_/g) || []).length;
      octaveCount = upOctave - downOctave;
    }

    // 构建包含左右括号的新音符
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
    };
  }

  // 默认返回值
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
  };
}

/**
 * 解析单个小节的数据
 *
 * @param measureData - 小节的原始字符串数据
 * @param noteCount - 当前已处理的音符总数
 * @returns 解析后的小节信息对象
 */
export function parseMeasure(measureData: string, noteCount: number) {
  const notes = measureData.split(/,(?![^<>]*>)/);
  let weight = 0;
  const noteOptions: SNNoteOptions[] = [];
  const notesLenth = notes.length;
  let totalTime = 0;
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
    } = parseNote(noteData);

    const startNote = totalTime % 1 == 0;
    weight += noteWeight;
    totalTime += nodeTime;
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
    } as SNNoteOptions);
  }
  return { weight, measureNoteCount: noteCount + notesLenth, noteOptions };
}

/**
 * 解析单个乐句中的小节数据并添加到五线谱选项中
 * @param stave 单个乐句的原始字符串数据
 * @param noteCount 当前已处理的音符总数
 * @param measureCount 当前已处理的小节总数
 * @returns 解析后的小节信息和更新后的音符、小节总数
 */
export function parseStave(
  stave: string,
  noteCount: number,
  measureCount: number,
) {
  const staveOption: SNStaveOptions = {
    index: 0,
    weight: 0,
    measureOptions: [],
    y: 0,
    endLine: false,
  };
  let tempWeight = 0;
  stave
    .trim()
    .split('|')
    .forEach((measure) => {
      const measureData = measure.trim();
      if (measureData === '') return; // 跳过空小节
      const { weight, measureNoteCount, noteOptions } = parseMeasure(
        measureData,
        noteCount,
      );
      tempWeight += weight;
      noteCount = measureNoteCount;
      staveOption.measureOptions.push({
        index: measureCount++,
        measureData,
        weight,
        noteOptions: noteOptions,
      } as SNMeasureOptions);
    });
  staveOption.weight = tempWeight;
  return { staveOption, noteCount, measureCount };
}

/**
 * 解析完整的谱面数据
 *
 * @param scoreData - 谱面的原始字符串数据
 * @returns 解析后的五线谱选项数组
 */
export function parseScore(scoreData: string) {
  let noteCount = 0;
  let measureCount = 0;
  const staveOptions: SNStaveOptions[] = [];

  scoreData.split('\n').forEach((stave) => {
    const {
      staveOption,
      noteCount: newNoteCount,
      measureCount: newMeasureCount,
    } = parseStave(stave, noteCount, measureCount);
    noteCount = newNoteCount;
    measureCount = newMeasureCount;
    staveOptions.push(staveOption);
  });

  return staveOptions;
}

/**
 * 解析ABC乐谱字符串，返回与parseScore一致的数据结构
 * @param abcScore - ABC乐谱字符串
 * @returns 解析后的乐谱数据对象
 */
export function abcparser(abcScore: string) {
  /**
   * @type {SNDataInfo}
   */
  const info: SNDataInfo = {
    title: '',
    composer: '',
    lyricist: '',
    beat: '',
    time: '',
    key: '',
    tempo: '',
  };
  const scoreLines: string[] = [];
  const lines = abcScore.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^T:/.test(trimmed)) {
      info.title = trimmed.replace(/^T:/, '').trim();
    } else if (/^M:/.test(trimmed)) {
      info.beat = trimmed.replace(/^M:/, '').trim();
    } else if (/^L:/.test(trimmed)) {
      info.time = trimmed.replace(/^L:/, '').trim();
    } else if (/^K:/.test(trimmed)) {
      info.key = trimmed.replace(/^K:/, '').trim();
    } else if (/^Q:/.test(trimmed)) {
      info.tempo = trimmed.replace(/^Q:/, '').trim();
    } else if (/^[A-Z]:/.test(trimmed)) {
      // 其它头部信息暂不处理
      continue;
    } else if (trimmed) {
      scoreLines.push(trimmed);
    }
  }
  const scoreStr = scoreLines.join('\n');
  const parsedScore = parseScore(scoreStr);
  return {
    info,
    score: scoreStr,
    parsedScore,
  };
}
