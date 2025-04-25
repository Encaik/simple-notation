import { SNMeasureOptions, SNNoteOptions, SNStaveOptions } from '@types';

/**
 * 解析单个音符的数据
 *
 * @param noteData - 音符的原始字符串数据
 * @returns 解析后的音符信息对象
 */
export function parseNote(noteData: string) {
  let weight = 10;
  let nodeTime = 0;
  let duration = '';
  let downCount = 0;
  let underlineCount = 0;

  let note = noteData.replaceAll(/\/\d+|\++|-+/g, (match) => {
    switch (match) {
      case '+':
        // 升号处理保留但暂未实现
        break;
      case '-':
        downCount++;
        break;
      default:
        duration = match.substring(1);
        break;
    }
    return '';
  });
  if (duration) {
    switch (duration) {
      case '0':
        underlineCount = 0;
        nodeTime += 4;
        break;
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
  if (downCount && !note) {
    note = '-';
    downCount = 0;
  }
  return { weight, nodeTime, note, underlineCount };
}

/**
 * 解析单个小节的数据
 *
 * @param measureData - 小节的原始字符串数据
 * @param noteCount - 当前已处理的音符总数
 * @returns 解析后的小节信息对象
 */
export function parseMeasure(measureData: string, noteCount: number) {
  const notes = measureData.split(',');
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
function parseStave(stave: string, noteCount: number, measureCount: number) {
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
