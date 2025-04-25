import { SNMeasureOptions, SNNoteOptions, SNStaveOptions } from '@types';
import { SNConfig } from '@config';

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
  let measureNoteCount = noteCount;
  let totalTime = 0;
  for (let index = 0; index < notes.length; index++) {
    let noteData = notes[index];
    if (noteData.endsWith('|')) {
      noteData = noteData.replaceAll('|', '');
      measureNoteCount += index + 1;
    }
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
  return { weight, measureNoteCount, noteOptions };
}

/**
 * 解析完整的谱面数据
 *
 * @param scoreData - 谱面的原始字符串数据
 * @returns 解析后的五线谱选项数组
 */
export function parseScore(scoreData: string) {
  let noteCount = 0;
  let staveOption: SNStaveOptions = {
    index: 0,
    weight: 0,
    measureOptions: [],
    y: 0,
    endLine: false,
  };
  let tempWeight = 0;
  const staveOptions: SNStaveOptions[] = [];

  scoreData.split('\n').forEach((measure, idx) => {
    const measureData = measure.trim();
    const { weight, measureNoteCount, noteOptions } = parseMeasure(
      measureData,
      noteCount,
    );
    tempWeight += weight;
    noteCount = measureNoteCount;
    if (tempWeight > SNConfig.score.lineWeight) {
      if (
        tempWeight <
        SNConfig.score.lineWeight + SNConfig.score.allowOverWeight
      ) {
        staveOption.measureOptions.push({
          index: idx + 1,
          measureData,
          weight,
          noteOptions: noteOptions,
        } as SNMeasureOptions);
        staveOption.weight = tempWeight;
        staveOptions.push(staveOption);
        tempWeight = 0;
        staveOption = {
          index: 0,
          weight: 0,
          measureOptions: [],
          y: 0,
          endLine: false,
        };
      } else {
        staveOption.weight = tempWeight - weight;
        staveOptions.push(staveOption);
        tempWeight = weight;
        staveOption = {
          index: 0,
          weight: 0,
          measureOptions: [
            {
              index: idx + 1,
              measureData,
              weight,
              noteOptions: noteOptions,
            } as SNMeasureOptions,
          ],
          y: 0,
          endLine: false,
        };
      }
    } else {
      staveOption.measureOptions.push({
        index: idx + 1,
        measureData,
        weight,
        noteOptions: noteOptions,
      } as SNMeasureOptions);
    }
  });
  if (staveOption.measureOptions.length > 0) {
    staveOption.weight = tempWeight;
    staveOptions.push(staveOption);
  }

  return staveOptions;
}
