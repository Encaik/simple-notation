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

/**
 * SNScore 类 - 简谱谱面渲染组件
 *
 * @class SNScore
 * @extends {SNBox}
 * @description
 * 这个类负责解析和渲染简谱的谱面内容，包括音符、小节线、
 * 连音线等。它会自动处理分行和布局，确保谱面美观易读。
 */
export class SNScore extends SNBox {
  /** SVG group 元素，作为谱面的容器 */
  el: SVGGElement;

  /** 五线谱选项数组，用于存储每行谱表的配置 */
  staveOptions: SNStaveOptions[] = [];

  /** 五线谱实例数组，存储已渲染的谱表 */
  staves: SNStave[] = [];

  /** 当前处理的音符总数 */
  noteCount: number = 0;

  /**
   * 创建一个新的谱面实例
   *
   * @param content - 父级内容容器组件
   * @param options - 谱面的配置选项
   * @description
   * 构造函数会：
   * 1. 计算并设置谱面区域的位置和大小
   * 2. 创建 SVG group 元素
   * 3. 绘制调试边界框（如果启用）
   */
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

  /**
   * 解析单个音符的数据
   *
   * @param noteData - 音符的原始字符串数据
   * @returns 解析后的音符信息对象
   * @description
   * 解析音符字符串，提取以下信息：
   * 1. 音符的权重（用于布局计算）
   * 2. 音符的时值
   * 3. 音高（包括升降号）
   * 4. 装饰线数量（用于显示音符时值）
   */
  parseNote(noteData: string) {
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
   * @description
   * 解析小节字符串，提取以下信息：
   * 1. 小节的总权重（用于布局计算）
   * 2. 小节中的音符数量
   * 3. 每个音符的详细信息
   */
  parseMeasure(measureData: string, noteCount: number) {
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

  /**
   * 解析完整的谱面数据
   *
   * @param scoreData - 谱面的原始字符串数据
   * @description
   * 解析整个谱面字符串，处理以下内容：
   * 1. 按行分割谱面数据
   * 2. 解析每个小节
   * 3. 根据权重自动分配谱表
   * 4. 处理跨行的小节
   */
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

  /**
   * 绘制完整的谱面
   *
   * @param scoreData - 谱面的原始字符串数据
   * @description
   * 完整的谱面渲染流程：
   * 1. 解析谱面数据
   * 2. 计算每个谱表的位置
   * 3. 创建并渲染所有谱表
   * 4. 处理歌词显示（如果有）
   */
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
