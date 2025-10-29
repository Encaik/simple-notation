import { SNAbcInput } from '../model/input';
import {
  SNMeasureMeta,
  SNParserElement,
  SNParserMeasure,
  SNParserMeta,
  SNParserNode,
  SNParserNote,
  SNParserRoot,
  SNParserScore,
  SNParserSection,
  SNParserTuplet,
  SNParserVoice,
  SNVoiceMetaClef,
} from '../model/parser';
import { BaseParser } from './base-parser';
import {
  SNAccidental,
  SNBarline,
  SNDuration,
  SNKeySignature,
  SNScoreProps,
} from '../../core/model/base.ts';

export class AbcParser extends BaseParser<SNAbcInput> {
  private currentId = 0;

  private getNextId(prefix: string): string {
    this.currentId++;
    return `${prefix}-${this.currentId}`;
  }

  parse(data: SNAbcInput): SNParserRoot {
    return this.parseRoot(data);
  }

  parseRoot(data: string): SNParserRoot {
    // 1. 先过滤所有注释行与空行
    const dataWithoutComments = data.replace(
      /^%.*$(?:\r?\n)?|^\s*$(?:\r?\n)?/gm,
      '',
    );

    // 2. 正则匹配完整乐谱块：
    // - 每段有且必须以X:开头
    // - 捕获所有内容直到下一个X:或文本结束
    const scoreRegex = /X:.*?(?=X:|$)/gs;

    // 3. 提取匹配结果，修剪首尾空白，过滤空内容
    const scores = (dataWithoutComments.match(scoreRegex) || [])
      .map((score) => score.trim())
      .filter((score) => score.length > 0);

    // 4. 兼容处理：如果没有匹配到，使用默认逻辑兜底
    if (scores.length === 0 && data.trim().length > 0) {
      scores.push(data.trim()); // 整体作为一个乐谱
    }

    const root = {
      id: this.getNextId('root'),
      type: 'root',
      parent: undefined,
      originStr: data,
    } as SNParserRoot;

    root.children = scores.map(
      (scoreData): SNParserScore => this.parseScore(root, scoreData),
    );

    return root;
  }

  parseScore(parent: SNParserRoot, scoreData: string): SNParserScore {
    // 解析乐谱头部和主体
    const { head, body } = this.splitScoreHeadAndBody(scoreData);
    const { id, meta, props } = this.parseScoreHeader(head);
    const sections = this.parseScoreBody(body);

    const score = {
      id: id || this.getNextId('score'),
      type: 'score',
      meta,
      parent,
      originStr: scoreData,
      props,
    } as SNParserScore;

    score.children = sections.map((sectionData) =>
      this.parseSection(score, sectionData),
    );

    return score;
  }

  private splitScoreHeadAndBody(scoreData: string): {
    head: string;
    body: string;
  } {
    // 1. 优先检查是否有 S:数字 标记，作为明确分隔点
    const sMarkerMatch = scoreData.match(/(?=\s*S:\d+\b)/s);
    if (sMarkerMatch) {
      const splitIndex = sMarkerMatch.index || 0;
      const head = scoreData.slice(0, splitIndex).trimEnd();
      const body = scoreData.slice(splitIndex).trimStart();
      return { head, body };
    }

    // 2. 无 S:数字 标记时，按元数据行分割头部和主体
    const lines = scoreData.split(/\r?\n/);
    const headLines: string[] = [];
    const bodyLines: string[] = [];
    let isHead = true;

    const metaLineRegex = /^\s*([TCOHZLMKQDPXGR]):/;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (isHead && trimmedLine && metaLineRegex.test(trimmedLine)) {
        // 元数据行，归为头部
        headLines.push(line);
      } else {
        // 非元数据行，切换到主体模式
        isHead = false;
        bodyLines.push(line);
      }
    }

    // 处理头部和主体（去除首尾空白）
    const head = headLines.join('\n').trim();
    const body = bodyLines.join('\n').trim();

    // 特殊情况：如果全是元数据行，则视为头部，主体为空
    return { head, body };
  }

  private parseScoreHeader(header: string): {
    id: string | null;
    meta: SNParserMeta;
    props: SNScoreProps;
  } {
    // 初始化默认值，使用更严格的类型约束
    const meta: SNParserMeta = {
      title: '',
      subtitle: '',
      contributors: [],
      copyright: '',
      noteLength: '1/4',
    };
    const props: SNScoreProps = {
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: { symbol: 'natural', letter: 'C' },
      tempo: { value: 120, unit: 'BPM' },
    };
    let id: string | null = null;

    // 按行分割头部（处理可能的\r\n换行）
    const lines = header
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    // 头部字段正则匹配规则（键值对）
    const fieldRegex = /^([XTCSMLQK]):\s*(.*)$/;

    for (const line of lines) {
      const match = line.match(fieldRegex);
      if (!match) continue; // 跳过不符合格式的行

      const [, key, value] = match; // 解构键和值

      switch (key) {
        case 'X':
          id = value || null; // 确保空值时为null
          break;

        case 'T':
          // 支持多个T:字段（主标题+副标题）
          if (meta.title) {
            meta.subtitle = value;
          } else {
            meta.title = value;
          }
          break;

        case 'C':
          meta.contributors!.push({ name: value, role: 'composer' });
          break;

        case 'M': {
          // 严格匹配拍号格式（数字/数字）
          const timeMatch = value.match(/^(\d+)\/(\d+)$/);
          if (timeMatch) {
            const [, num, den] = timeMatch.map(Number);
            if (num > 0 && den > 0) {
              // 验证有效性
              props.timeSignature = { numerator: num, denominator: den };
            }
          }
          break;
        }

        case 'K': {
          // 解析调号（支持#/b/自然调，如C#、Db、G等）
          const keyMatch = value.match(/^([A-Ga-g])([#b])?(m)?$/);
          if (keyMatch) {
            const [, letter, accidental] = keyMatch;
            props.keySignature = {
              letter: letter.toUpperCase(),
              symbol:
                accidental === '#'
                  ? 'sharp'
                  : accidental === 'b'
                    ? 'flat'
                    : 'natural',
            };
          }
          break;
        }

        case 'Q': {
          // 解析速度标记（支持1/4=120或120=Q等格式）
          const tempoMatch = value.match(/(?:\d+\/?\d*=)?(\d+)/);
          if (tempoMatch) {
            const bpm = parseInt(tempoMatch[1], 10);
            if (!isNaN(bpm) && bpm > 0) {
              props.tempo = {
                value: bpm,
                unit: 'BPM',
              };
            }
          }
          break;
        }

        case 'L':
          // 解析基本音符长度（如1/8、1/4等）
          if (/^\d+\/\d+$/.test(value)) {
            meta.noteLength = value;
          }
          break;

        case 'S':
          // 头部的S:字段视为来源信息（存入meta的copyright）
          meta.copyright = value;
          break;
      }
    }

    return { id, meta, props };
  }

  private parseScoreBody(body: string): string[] {
    // 1. 匹配所有以S:开头的章节（包含S:本身）
    // 正则：全局匹配以S:开头，直到下一个S:或结束的内容
    const sectionRegex = /S:.*?(?=S:|$)/gs;
    return body.match(sectionRegex) || [body];
  }

  parseSection(parent: SNParserScore, sectionData: string): SNParserSection {
    // 命名捕获组：提取S:冒号后的内容（sMetaValue）和剩余内容（rest）
    const sectionMatch = sectionData.match(
      /^\s*S:\s*(?<sMetaValue>.*?)(?:\r?\n|$)(?<rest>.*)$/s,
    );

    // 解构获取值（处理无S:的情况）
    const { sMetaValue = '', rest = sectionData.trim() } =
      sectionMatch?.groups || {};

    // 用命名捕获组的rest内容拆分声部
    const voiceMatch = rest.trim().match(/(?<voice>V:.*?(?=\s*V:|$))/gs);
    const voices = voiceMatch?.map((v) => v.trim()) || [];

    // 处理无V:的情况
    if (voices.length === 0 && rest.trim()) {
      voices.push(rest.trim());
    }

    const section = {
      id: sMetaValue || this.getNextId('section'),
      type: 'section',
      parent,
      originStr: sectionData,
    } as SNParserSection;

    section.children = voices.map((voiceData) =>
      this.parseVoice(section, voiceData),
    );

    return section;
  }

  parseVoice(parent: SNParserSection, voiceData: string): SNParserVoice {
    // 1. 正则拆分V:元信息行和小节内容
    const voiceMatch = voiceData.match(
      /^\s*V:\s*(\d+)\s*(?<metaLine>.*?)(?:\r?\n|$)(?<measuresContent>.*)$/s,
    );

    // 解构获取元信息行和小节内容（兼容格式异常）
    const { metaLine = '', measuresContent = voiceData.trim() } =
      voiceMatch?.groups || {};
    const voiceNumber = voiceMatch
      ? voiceMatch[1]
      : Math.floor(Math.random() * 100).toString();

    // 2. 解析声部元信息（name、clef）
    const name = (
      metaLine.match(/name="([^"]+)"/)?.[1] || `Voice ${voiceNumber}`
    ).trim();
    const clefMatch = metaLine.match(/clef=([a-z]+)/);
    const clef: SNVoiceMetaClef =
      (clefMatch?.[1] as SNVoiceMetaClef) || 'treble'; // 默认为高音谱号

    // 3. 初步拆分小节（按 | 分割，保留原始内容）
    const rawMeasures = measuresContent
      .split('|')
      .map((measure) => measure.trim())
      .filter(Boolean);

    // 4. 初始化两个数组
    const metadataMeasures: string[] = [];
    const musicMeasures: string[] = [];

    // 5. 遍历拆分（元数据识别正则）
    const metaPattern = /^\[([KMTL]:|key|meter|title|tempo).*]$/i; // 扩展常见元数据
    rawMeasures.forEach((measure) => {
      if (metaPattern.test(measure)) {
        metadataMeasures.push(measure);
      } else {
        musicMeasures.push(measure);
      }
    });

    // 4. 生成唯一ID（基于声部编号和名称）
    const id = `voice-${voiceNumber}-${name.toLowerCase().replace(/\W+/g, '-')}`;
    let duration = 0;
    const voice = {
      id,
      type: 'voice',
      isPrimary: false, // 默认非主声部，后续可外部调整
      meta: {
        clef,
        transpose: undefined, // 可扩展：从metaLine匹配 transpose=±数字
        keySignature: this.parseKeySignature(metadataMeasures.join()), // 提取声部专属调号
      },
      parent,
      originStr: voiceData,
    } as SNParserVoice;
    const children: SNParserMeasure[] = musicMeasures.map((measureData, i) => {
      const measure = this.parseMeasure(voice, measureData, i + 1);
      duration += measure.duration || 0;
      return measure;
    });

    voice.duration = duration;
    voice.children = children;

    return voice;
  }

  parseMeasure(
    parent: SNParserVoice,
    measureData: string,
    index: number,
  ): SNParserMeasure {
    const barline = this.parseBarline(measureData);
    const elementsData = measureData.replace(':', '');
    let measure = {
      id: this.getNextId('measure'),
      type: 'measure',
      index,
      parent,
      originStr: measureData,
    } as SNParserMeasure;

    // 解析小节内元素（逻辑不变）
    const { elements, duration } = this.parseElements(measure, elementsData);

    // 构建元数据
    const meta: SNMeasureMeta = {
      barline,
    };

    measure = {
      ...measure,
      meta,
      duration,
      children: elements,
    };

    return measure;
  }

  private parseBarline(measureData: string): SNBarline[] | undefined {
    const barlines: SNBarline[] = [];
    if (measureData.startsWith(':')) {
      barlines.push({
        id: this.getNextId('barline'),
        type: 'barline',
        style: 'repeat-start',
      });
    }
    if (measureData.endsWith(':')) {
      barlines.push({
        id: this.getNextId('barline'),
        type: 'barline',
        style: 'repeat-end',
      });
    }
    return barlines.length ? barlines : undefined;
  }

  private parseKeySignature(content: string): SNKeySignature | undefined {
    const keyMatch = content.match(/\[K:([A-Ga-g#b]+)]/);
    if (!keyMatch) return undefined;

    const key = keyMatch[1];
    const isSharp = key.includes('#');
    const isFlat = key.includes('b');
    const letter = key.replace(/[#b]/g, '').toUpperCase();

    return letter
      ? {
          symbol: isSharp ? 'sharp' : isFlat ? 'flat' : 'natural',
          letter,
        }
      : undefined;
  }

  parseElements(
    parent: SNParserMeasure,
    elementsData: string,
  ): {
    elements: SNParserElement[];
    duration: SNDuration;
  } {
    const tokens = this.tokenizeMeasure(elementsData);
    const elements: SNParserElement[] = [];
    let duration: SNDuration = 0;

    for (const token of tokens) {
      try {
        const element = this.parseElement(parent, token);
        if (element) {
          elements.push(element);
          if ('duration' in element) {
            duration += element.duration || 0;
          }
        }
      } catch (error) {
        console.warn(`Skipping unsupported element: ${token}`);
      }
    }

    return {
      elements,
      duration,
    };
  }

  parseElement(parent: SNParserNode, elementData: string): SNParserElement {
    const trimmed = elementData.trim();

    if (!trimmed) throw new Error('Empty element');

    // 处理延音线
    if (trimmed === '-') {
      return {
        type: 'tie', // 定义连音线类型
        id: this.getNextId('tie'),
        style: 'slur', // 可扩展为不同类型的连音线
        originStr: elementData,
      };
    }

    // 1. 优先处理所有连音（(3BBB、(5ABCDF 等）
    const tupletMatch = trimmed.match(/^\((\d+)([\s\S]*?)\)?$/);
    if (tupletMatch) {
      const [, countStr, innerNotesStr] = tupletMatch;
      const count = parseInt(countStr, 10); // 连音数量（3/5等）

      // 关键：拆分连音内部的音符（如 "BBB" → ["B", "B", "B"]）
      const innerNotes = this.tokenizeMeasure(innerNotesStr);

      const tuplet = {
        type: 'tuplet',
        id: this.getNextId('tuplet'),
        count,
        parent,
        originStr: trimmed,
      } as SNParserTuplet;

      tuplet.children = innerNotes.map(
        (noteStr) => this.parseElement(tuplet, noteStr) as SNParserNote,
      );

      // 计算连音总时值（复用多连音规则）
      const baseDuration = tuplet.children[0]?.duration;
      tuplet.duration = baseDuration! * (count - 1);

      return tuplet;
    }

    // 2. 解析休止符（如 z4、z8.）
    if (trimmed.startsWith('z')) {
      return {
        type: 'rest',
        id: this.getNextId('rest'),
        parent,
        duration: parseInt(trimmed.slice(1), 10),
        originStr: elementData,
      };
    }

    // 3. 解析普通音符（严格遵循ABC语法：支持时值在前/后、变音、八度、附点）
    const noteMatch = trimmed.match(
      /^(\^+\/?|_+\/?|=?)([A-Ga-g])([,']*)(\d*)(\.*)$/,
    );
    if (noteMatch) {
      const [, accidentalStr, letter, octaveSymbols, durationStr] = noteMatch;

      // 1. 解析变音记号（映射为标准名称）
      let accidental: SNAccidental = SNAccidental.NATURAL;
      if (accidentalStr) {
        switch (accidentalStr) {
          case '^':
            accidental = SNAccidental.SHARP;
            break; // 升半音
          case '^^':
            accidental = SNAccidental.DOUBLE_SHARP;
            break; // 重升（全音）
          case '_':
            accidental = SNAccidental.FLAT;
            break; // 降半音
          case '__':
            accidental = SNAccidental.DOUBLE_FLAT;
            break; // 重降（全音）
          case '=':
            accidental = SNAccidental.NATURAL;
            break; // 还原
          default:
            accidental = SNAccidental.NATURAL;
        }
      }

      // 2. 解析八度（','降八度，'''升八度）
      const baseOctave: number = letter === letter.toUpperCase() ? 3 : 4;

      // 结合八度符号调整（, 降八度，' 升八度）
      const octaveOffset = octaveSymbols.split('').reduce((offset, sym) => {
        return sym === ',' ? offset - 1 : sym === "'" ? offset + 1 : offset;
      }, 0);
      const octave = baseOctave + octaveOffset;

      // 3. 解析时值
      const duration = durationStr ? parseInt(durationStr, 10) : 1;

      return {
        id: this.getNextId('note'),
        type: 'note',
        parent,
        pitch: {
          letter: letter.toUpperCase(),
          octave,
          accidental,
        },
        duration,
        originStr: trimmed,
      } as SNParserNote;
    }

    throw new Error(`Unsupported element: ${elementData}`);
  }

  private tokenizeMeasure(measureData: string): string[] {
    const tokens: string[] = [];
    let pos = 0;
    const len = measureData.length;
    const noteRegex = /[A-Ga-gz]/; // 音符/休止符起始字符（A-G/z）

    while (pos < len) {
      // 跳过空白
      if (/\s/.test(measureData[pos])) {
        pos++;
        continue;
      }

      // 处理连音线（延音符号 -）
      if (measureData[pos] === '-') {
        tokens.push('-');
        pos++;
        continue;
      }

      // 1. 优先捕获连音（ABC语法：(n+音符，n为数字）
      if (
        measureData[pos] === '(' &&
        pos + 1 < len &&
        /\d/.test(measureData[pos + 1])
      ) {
        // 提取连音数量（n）
        let nStr = '';
        let i = pos + 1;
        while (i < len && /\d/.test(measureData[i])) {
          nStr += measureData[i];
          i++;
        }
        const n = parseInt(nStr, 10);
        if (isNaN(n) || n < 2) {
          // 连音数量至少为2
          pos++;
          continue;
        }

        // 收集连音内的n个音符
        const tupletNotes: string[] = [];
        let currentPos = i; // 从数字后的位置开始

        while (tupletNotes.length < n && currentPos < len) {
          // 跳过音符间空白
          if (/\s/.test(measureData[currentPos])) {
            currentPos++;
            continue;
          }

          // 提取单个音符（含变音、八度、时值、附点）
          if (noteRegex.test(measureData[currentPos])) {
            let noteEnd = currentPos;
            // 音符后可跟：变音(#b)、八度(')、时值(数字)、附点(.)
            while (
              noteEnd + 1 < len &&
              /[#b',.\d]/.test(measureData[noteEnd + 1])
            ) {
              noteEnd++;
            }
            noteEnd++; // 包含音符起始字符
            const note = measureData.slice(currentPos, noteEnd);
            tupletNotes.push(note);
            currentPos = noteEnd;
          } else {
            // 遇到非音符字符，终止连音收集（如闭括号、其他符号）
            break;
          }
        }

        // 组合连音token（保留原始格式）
        const tupletToken = `(${n}${measureData.slice(i, currentPos).replace(/\s+/g, ' ')})`;
        tokens.push(tupletToken.trim());
        pos = currentPos;
        continue;
      }

      // 2. 捕获普通音符/休止符（A-G/z开头，含变音、八度等）
      if (noteRegex.test(measureData[pos])) {
        let noteEnd = pos;
        while (
          noteEnd + 1 < len &&
          /[#b',.\d]/.test(measureData[noteEnd + 1])
        ) {
          noteEnd++;
        }
        noteEnd++;
        tokens.push(measureData.slice(pos, noteEnd));
        pos = noteEnd;
        continue;
      }

      // 3. 捕获其他符号（如元数据[K:C]、小节线等）
      let tokenEnd = pos;
      while (tokenEnd < len && !/\s|[A-Ga-gz(]/.test(measureData[tokenEnd])) {
        tokenEnd++;
      }
      const token = measureData.slice(pos, tokenEnd).trim();
      if (token) tokens.push(token);
      pos = tokenEnd;
    }

    return tokens;
  }
}
