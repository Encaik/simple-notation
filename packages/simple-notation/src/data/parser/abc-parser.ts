import { SNAbcInput } from '../model/input';
import {
  SNScoreCollection,
  SNScore,
  SNSection,
  SNVoice,
  SNMeasure,
  SNMeasureElement,
  SNDuration,
  SNVoiceMetaClef,
  SNParserMeta,
  SNParserScoreMeta,
} from '../model/parser';
import { BaseParser } from './base-parser';

export class AbcParser extends BaseParser<SNAbcInput> {
  private currentId = 0;
  private getNextId(prefix: string): string {
    this.currentId++;
    return `${prefix}-${this.currentId}`;
  }

  parse(data: SNAbcInput): SNScoreCollection {
    return this.parseScoreCollection(data);
  }

  parseScoreCollection(scoreCollectionData: string): SNScoreCollection {
    // 第一步：分割成多个乐谱
    const scores: string[] = this.splitIntoScores(scoreCollectionData);

    return {
      id: this.getNextId('collection'),
      name: 'ABC Score Collection',
      scores: scores.map((scoreData) => this.parseScore(scoreData)),
    };
  }

  // 在AbcParser类中替换splitIntoScores方法
  private splitIntoScores(data: string): string[] {
    // 1. 先过滤所有注释行（仅保留乐谱内的注释，去除独立于乐谱的注释）
    const dataWithoutComments = data.replace(/(?<!\n)\n\s*%.*?(?=\n|$)/g, '');

    // 2. 正则匹配完整乐谱块：
    // - 以X:开头（允许前导空白或换行）
    // - 捕获所有内容（包括换行、声部、音符等）直到下一个X:或文本结束
    const scoreRegex = /^\s*X:[\s\S]*?(?=\s*X:|$)/gm;

    // 3. 提取匹配结果，修剪首尾空白，过滤空内容
    const scores = (dataWithoutComments.match(scoreRegex) || [])
      .map(score => score.trim())
      .filter(score => score.length > 0);

    // 4. 兼容处理：如果没有匹配到，使用默认逻辑兜底
    if (scores.length === 0 && data.trim().length > 0) {
      return [data.trim()]; // 整体作为一个乐谱
    }

    return scores;
  }

  parseScore(scoreData: string): SNScore {
    console.log(scoreData);

    // 第二步：解析乐谱头部和主体
    const { header, body } = this.splitScoreHeaderBody(scoreData);
    const meta = this.parseScoreHeader(header);

    // 第三步：从主体中解析章节
    const sections = this.parseSectionsFromBody(body);

    return {
      id: this.getNextId('score'),
      name: meta.title || 'Untitled Score',
      meta,
      scoreMeta: {
        timeSignature: meta.timeSignature,
        keySignature: meta.keySignature,
        tempo: meta.tempo,
      },
      sections,
    };
  }

  parseSection(sectionData: string): SNSection {
    // 第四步：解析章节中的声部
    const voices = this.parseVoicesFromSection(sectionData);

    return {
      id: this.getNextId('section'),
      name: this.extractSectionName(sectionData),
      meta: {
        title: this.extractSectionName(sectionData),
        contributors: [],
      },
      scoreMeta: {},
      voices,
    };
  }

  parseVoice(voiceData: string): SNVoice {
    // 第五步：解析声部中的小节
    const measures = this.parseMeasuresFromVoice(voiceData);

    return {
      id: this.getNextId('voice'),
      name: this.extractVoiceName(voiceData),
      isPrimary: this.isPrimaryVoice(voiceData),
      voiceMeta: { clef: this.extractClef(voiceData) },
      measures,
    };
  }

  /**
   * 第二步：分割乐谱的头部和主体
   */
  private splitScoreHeaderBody(scoreData: string): {
    header: string;
    body: string;
  } {
    const lines = scoreData.split('\n');
    const headerLines: string[] = [];
    const bodyLines: string[] = [];
    let inHeader = true;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === '' || trimmedLine.startsWith('%')) {
        // 注释和空行根据上下文决定归属
        if (inHeader) {
          headerLines.push(trimmedLine);
        } else {
          bodyLines.push(trimmedLine);
        }
        continue;
      }

      if (inHeader && trimmedLine.match(/^[A-Z]:/)) {
        headerLines.push(trimmedLine);
      } else {
        // 遇到第一个非头部字段，切换到主体
        inHeader = false;
        bodyLines.push(trimmedLine);
      }
    }

    return {
      header: headerLines.join('\n'),
      body: bodyLines.join('\n'),
    };
  }

  /**
   * 第三步：从主体文本解析所有章节
   */
  private parseSectionsFromBody(body: string): SNSection[] {
    // 根据章节注释或声部变化来分割章节
    const sectionBlocks = this.splitIntoSections(body);

    return sectionBlocks.map((block) => this.parseSection(block));
  }

  /**
   * 第四步：从章节文本解析所有声部
   */
  private parseVoicesFromSection(sectionData: string): SNVoice[] {
    // 按声部分割章节数据
    const voiceBlocks = this.splitIntoVoices(sectionData);

    return voiceBlocks.map((block) => this.parseVoice(block));
  }

  /**
   * 第五步：从声部文本解析所有小节
   */
  private parseMeasuresFromVoice(voiceData: string): SNMeasure[] {
    // 分割小节
    const measureStrings = voiceData.split('|').filter((m) => m.trim());

    return measureStrings.map((measureStr) =>
      this.parseMeasure(measureStr.trim()),
    );
  }

  /**
   * 解析小节
   */
  parseMeasure(measureData: string): SNMeasure {
    const elements = this.parseElements(measureData);

    return {
      id: this.getNextId('measure'),
      number: 0,
      elements,
      barline: {
        type: 'barline',
        id: this.getNextId('barline'),
        style: 'single', //this.determineBarlineStyle(measureData),
      },
    };
  }

  /**
   * 解析小节内的元素
   */
  parseElements(measureData: string): SNMeasureElement[] {
    const tokens = this.tokenizeMeasure(measureData);
    const elements: SNMeasureElement[] = [];

    for (const token of tokens) {
      try {
        const element = this.parseElement(token);
        if (element) {
          elements.push(element);
        }
      } catch (error) {
        console.warn(`Skipping unsupported element: ${token}`);
      }
    }

    return elements;
  }

  /**
   * 解析单个元素
   */
  parseElement(elementData: string): SNMeasureElement {
    const trimmed = elementData.trim();

    if (!trimmed) throw new Error('Empty element');

    // 休止符
    if (trimmed.startsWith('z')) {
      return {
        type: 'rest',
        id: this.getNextId('rest'),
        duration: this.parseDuration(trimmed),
      };
    }

    // 音符
    const noteMatch = trimmed.match(
      /^\(?(\d*)([A-Ga-g])([#b]?)([,']*)(\.*)\)?$/,
    );
    if (noteMatch) {
      const [, durationStr, letter, octaveSymbols, dotsStr] = noteMatch;

      let octave = 4;
      for (const sym of octaveSymbols) {
        octave += sym === "'" ? 1 : -1;
      }

      return {
        type: 'note',
        id: this.getNextId('note'),
        pitch: {
          letter: letter.toUpperCase(),
          octave,
        },
        duration: this.parseDuration(durationStr || '4', dotsStr.length),
      };
    }

    throw new Error(`Unsupported element: ${elementData}`);
  }

  // ========== 文本分割方法 ==========

  private splitIntoSections(body: string): string[] {
    const lines = body.split('\n');
    const sections: string[] = [];
    let currentSection: string[] = [];

    for (const line of lines) {
      // 章节边界：新的声部定义或章节注释
      if (line.startsWith('V:') || line.includes('% 章节')) {
        if (currentSection.length > 0) {
          sections.push(currentSection.join('\n'));
          currentSection = [];
        }
      }

      currentSection.push(line);
    }

    // 添加最后一个章节
    if (currentSection.length > 0) {
      sections.push(currentSection.join('\n'));
    }

    return sections;
  }

  private splitIntoVoices(sectionData: string): string[] {
    const lines = sectionData.split('\n');
    const voices: { [key: string]: string[] } = {};
    let currentVoice = 'default';

    for (const line of lines) {
      if (line.startsWith('V:')) {
        const voiceMatch = line.match(/V:([^ ]+)/);
        if (voiceMatch) {
          currentVoice = voiceMatch[1];
          if (!voices[currentVoice]) {
            voices[currentVoice] = [];
          }
        }
      } else if (!line.startsWith('%')) {
        if (!voices[currentVoice]) {
          voices[currentVoice] = [];
        }
        voices[currentVoice].push(line);
      }
    }

    return Object.values(voices).map((voiceLines) => voiceLines.join('\n'));
  }

  // ========== 提取信息方法 ==========

  private extractSectionName(sectionData: string): string {
    const commentMatch = sectionData.match(/%\s*(.+?)(?:\n|$)/);
    return commentMatch ? commentMatch[1] : `Section ${this.currentId}`;
  }

  private extractVoiceName(voiceData: string): string {
    const nameMatch = voiceData.match(/name=([^ ]+)/);
    return nameMatch ? nameMatch[1] : 'Voice';
  }

  private extractClef(voiceData: string): SNVoiceMetaClef {
    const clefMatch = voiceData.match(/clef=([^ ]+)/);
    return clefMatch ? (clefMatch[1] as SNVoiceMetaClef) : 'treble';
  }

  private isPrimaryVoice(voiceData: string): boolean {
    return voiceData.includes('is_primary=true') || voiceData.includes('V:1');
  }

  private tokenizeMeasure(measureData: string): string[] {
    return (
      measureData.match(
        /(\[[^\]]+\]|\(?\d*[A-Ga-g][,']*[#b]?\d*\.*\)?|z\d*\.*|\s+)/g,
      ) || []
    );
  }

  private parseDuration(elementData: string, dotCount: number = 0): SNDuration {
    const durationMatch = elementData.match(/(\d+)/);
    const value = durationMatch ? parseInt(durationMatch[0]) : 4;

    const dotsFromData = (elementData.match(/\./g) || []).length;
    const totalDots = Math.max(dotsFromData, dotCount);

    return {
      value,
      dots: totalDots > 0 ? totalDots : undefined,
    };
  }

  private parseScoreHeader(
    headerData: string,
  ): SNParserMeta & SNParserScoreMeta {
    const lines = headerData.split('\n');
    const result: SNParserMeta & SNParserScoreMeta = {
      title: 'Untitled Score',
      contributors: [],
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: { symbol: 'natural', letter: 'C' },
      tempo: { value: 120, unit: 'BPM' },
    };

    for (const line of lines) {
      if (!line.includes(':')) continue;
      const key = line[0];
      const value = line.slice(2).trim();

      switch (key) {
        case 'X':
          break;
        case 'T':
          if (!result.title || result.title === 'Untitled Score') {
            result.title = value;
          } else {
            result.subtitle = value;
          }
          break;
        case 'S':
          result.subtitle = value;
          break;
        case 'C':
          result.contributors.push({ name: value, role: 'composer' });
          break;
        case 'M': {
          const [num, den] = value.split('/').map(Number);
          if (num && den) {
            result.timeSignature = { numerator: num, denominator: den };
          }
          break;
        }
        case 'K': {
          const isSharp = value.includes('#');
          const isFlat = value.includes('b');
          const letter = value.replace(/[#bm]/g, '').toUpperCase();
          if (letter) {
            result.keySignature = {
              symbol: isSharp ? 'sharp' : isFlat ? 'flat' : 'natural',
              letter,
            };
          }
          break;
        }
        case 'Q': {
          const bpmMatch = value.match(/(\d+)=Q/);
          if (bpmMatch) {
            result.tempo = { value: parseInt(bpmMatch[1]), unit: 'BPM' };
          }
          break;
        }
        case 'L': {
          break;
        }
      }
    }

    return result;
  }
}
