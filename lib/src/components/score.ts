import { SNBox } from '@core';
import { SNContent } from './content';
import {
  SNMeasureOptions,
  SNNoteOptions,
  SNScoreOptions,
  SNStaveOptions,
} from '@types';
import { SvgUtils } from '@utils';
import { SNConfig } from '@config';
import { SNStave } from './stave';
import { SNRuntime } from '../config/runtime';

export class SNScore extends SNBox {
  el: SVGGElement;
  staveOptions: SNStaveOptions[] = [];
  staves: SNStave[] = [];
  noteCount: number = 0;

  constructor(content: SNContent, options: SNScoreOptions) {
    super(
      content.innerX,
      content.innerY + (content.info?.height || 0),
      content.innerWidth,
      content.innerHeight - (content.info?.height || 0),
      options.padding,
    );
    this.el = SvgUtils.createG({
      tag: 'score',
    });
    content.el.appendChild(this.el);
    this.drawBorderBox(this.el, SNConfig.debug.borderbox?.score);
  }

  parseNote(noteData: string) {
    let weight = 10;
    let nodeTime = 0;
    let duration = '';
    let upCount = 0;
    let downCount = 0;
    let underlineCount = 0;

    let note = noteData.replaceAll(/\/\d+|\++|\-+/g, (match) => {
      switch (match) {
        case '+':
          upCount++;
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

  parseMeasure(measureData: string, noteCount: number) {
    const notes = measureData.split(',');
    let weight = 0;
    let noteOptions: SNNoteOptions[] = [];
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
      } = this.parseNote(noteData);
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

  parseScore(scoreData: string) {
    let staveOption: SNStaveOptions = {
      index: 0,
      weight: 0,
      measureOptions: [],
      y: 0,
      endLine: false,
    };
    let tempWeight = 0;
    scoreData.split('\n').forEach((measure, idx) => {
      const measureData = measure.trim();
      const { weight, measureNoteCount, noteOptions } = this.parseMeasure(
        measureData,
        this.noteCount,
      );
      tempWeight += weight;
      this.noteCount = measureNoteCount;
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
          this.staveOptions.push(staveOption);
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
          this.staveOptions.push(staveOption);
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
      this.staveOptions.push(staveOption);
    }
  }

  draw(scoreData: string) {
    this.parseScore(scoreData.trim());
    let totalY = this.innerY;
    this.staveOptions.forEach((option, idx) => {
      option.index = idx + 1;
      option.y = totalY;
      option.endLine = option.index === this.staveOptions.length;
      const stave = new SNStave(this, option);
      this.staves.push(stave);
      totalY +=
        SNConfig.score.lineHeight +
        SNConfig.score.lineSpace +
        (SNRuntime.lyric ? SNConfig.score.lyricHeight : 0);
    });
  }
}
