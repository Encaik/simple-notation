import {
  SNAbcInput,
  SNParserElement,
  SNVoiceMetaClef,
  SNRootMeta,
  SNScoreMeta,
  SNSectionMeta,
  SNMeasureMeta,
} from '@data/model';
import { BaseParser } from '@data/parser';
import {
  SNAccidental,
  SNBarline,
  SNKeySignature,
  SNTimeSignature,
} from '@core/model/music';
import { SNTimeUnit } from '@core/model/ticks';
import { SNMusicProps, SNScoreProps } from '@data/model/props';
import {
  noteValueToDuration,
  validateMeasureDuration,
  getTimeUnitFromNode,
  calculateStartPosition,
  calculateEndPosition,
} from '@core/utils/time-unit';
import {
  SNParserMeasure,
  SNParserNote,
  SNParserRoot,
  SNParserScore,
  SNParserSection,
  SNParserVoice,
  SNParserRest,
  SNParserTuplet,
  SNParserTie,
  SNParserLyric,
  SNParserNode,
} from '@data/node';
import type { SNLyricAlignmentType } from '@data/node/lyric';

/**
 * 将 ABC 的 noteLength（如 "1/4", "1/8"）转换为 SNTimeUnit
 * ticksPerWhole = (1 / noteLength) * 12，支持三连音且常见音符都是整数 ticks
 */
function convertAbcNoteLengthToTimeUnit(
  noteLength: string,
  timeSignature?: { numerator: number; denominator: number },
): SNTimeUnit {
  const match = noteLength.match(/^(\d+)\/(\d+)$/);
  if (!match) {
    const ticksPerWhole = 48;
    const ticksPerBeat = timeSignature
      ? Math.round(ticksPerWhole / timeSignature.denominator)
      : 12;
    return { ticksPerWhole, ticksPerBeat };
  }

  const [, num, den] = match.map(Number);
  const noteValue = num / den;
  const ticksPerWhole = Math.round((1 / noteValue) * 12);
  const ticksPerBeat = timeSignature
    ? Math.round(ticksPerWhole / timeSignature.denominator)
    : Math.round(ticksPerWhole / 4);

  return { ticksPerWhole, ticksPerBeat };
}

export class AbcParser extends BaseParser<SNAbcInput> {
  private currentId = 0;

  private getNextId(prefix: string): string {
    this.currentId++;
    return `${prefix}-${this.currentId}`;
  }

  parse(data: SNAbcInput): SNParserRoot {
    return this.parseRoot(data);
  }

  /**
   * 解析 Root（文件级别）
   * 处理文件头（%% 指令）和多个 tune（每个以 X: 开头）
   */
  parseRoot(data: string): SNParserRoot {
    const { fileHeader, tunesData } = this.splitFileHeaderAndTunes(data);
    const parsedFileHeader = this.parseFileHeader(fileHeader);

    const scoreRegex = /X:.*?(?=X:|$)/gs;
    const scores = (tunesData.match(scoreRegex) || [])
      .map((score) => score.trim())
      .filter((score) => score.length > 0);

    if (scores.length === 0 && tunesData.trim().length > 0) {
      scores.push(tunesData.trim());
    }

    const root = new SNParserRoot({
      id: this.getNextId('root'),
      originStr: data,
    });

    if (parsedFileHeader) {
      parsedFileHeader.tuneCount = scores.length;
      root.setMeta(parsedFileHeader);
    } else if (scores.length > 0) {
      root.setMeta({ tuneCount: scores.length });
    }

    return root.addChildren(
      scores.map(
        (scoreData): SNParserScore =>
          this.parseScore(scoreData, parsedFileHeader || undefined),
      ),
    );
  }

  private splitFileHeaderAndTunes(data: string): {
    fileHeader: string;
    tunesData: string;
  } {
    const firstTuneMatch = data.match(/^X:\s*\d+/m);

    if (!firstTuneMatch || firstTuneMatch.index === undefined) {
      return { fileHeader: '', tunesData: data };
    }

    const fileHeader = data.slice(0, firstTuneMatch.index).trim();
    const tunesData = data.slice(firstTuneMatch.index).trim();

    return { fileHeader, tunesData };
  }

  /**
   * 解析文件头元数据，处理 %% 开头的指令和注释
   * 支持 %%abc-2.1、%%abc 2.1、%%encoding utf-8 等格式
   */
  private parseFileHeader(header: string): SNRootMeta | undefined {
    if (!header.trim()) {
      return undefined;
    }

    const rootMeta: SNRootMeta = {
      directives: {},
      comments: [],
    };

    const lines = header.split(/\r?\n/).map((line) => line.trim());

    for (const line of lines) {
      if (!line) continue;

      const directiveMatch = line.match(/^%%([a-zA-Z0-9_.-]+)(?:\s+(.+))?$/);
      if (directiveMatch) {
        const [, key, value] = directiveMatch;

        if (key === 'abc') {
          rootMeta.version = value || '';
        } else if (key.startsWith('abc-')) {
          const afterAbc = key.slice(4);
          if (/^\d[0-9.]*$/.test(afterAbc)) {
            rootMeta.version = afterAbc;
          } else {
            rootMeta.directives![key] = value || '';
          }
        } else if (key === 'encoding') {
          rootMeta.encoding = value || '';
        } else {
          rootMeta.directives![key] = value || '';
        }
        continue;
      }

      if (line.startsWith('%') && !line.startsWith('%%')) {
        rootMeta.comments!.push(line.slice(1).trim());
        continue;
      }

      if (line.length > 0 && !line.match(/^[A-Z]:/)) {
        rootMeta.comments!.push(line);
      }
    }

    if (
      !rootMeta.version &&
      !rootMeta.encoding &&
      Object.keys(rootMeta.directives || {}).length === 0 &&
      (rootMeta.comments?.length || 0) === 0
    ) {
      return undefined;
    }

    return rootMeta;
  }

  parseScore(scoreData: string, rootMeta?: SNRootMeta): SNParserScore {
    const { head, body } = this.splitScoreHeadAndBody(scoreData);
    const { id, meta, props } = this.parseScoreHeader(head, rootMeta);
    const sections = this.parseScoreBody(body);

    const score = new SNParserScore({
      id: id || this.getNextId('score'),
      originStr: scoreData,
    })
      .setMeta(meta)
      .setProps(props);

    // 解析 Section（不需要传递父节点，使用时通过 getVoices() 向上追溯）
    const sectionNodes = sections.map((sectionData) =>
      this.parseSection(sectionData),
    );

    return score.addChildren(sectionNodes);
  }

  private splitScoreHeadAndBody(scoreData: string): {
    head: string;
    body: string;
  } {
    const sMarkerMatch = scoreData.match(/(?=\s*S:\d+\b)/s);
    if (sMarkerMatch) {
      const splitIndex = sMarkerMatch.index || 0;
      return {
        head: scoreData.slice(0, splitIndex).trimEnd(),
        body: scoreData.slice(splitIndex).trimStart(),
      };
    }

    const lines = scoreData.split(/\r?\n/);
    const headLines: string[] = [];
    const bodyLines: string[] = [];
    let isHead = true;
    const metaLineRegex = /^\s*([TCOHZLMKQDPXGR]):/;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (isHead && trimmedLine && metaLineRegex.test(trimmedLine)) {
        headLines.push(line);
      } else {
        isHead = false;
        bodyLines.push(line);
      }
    }

    return {
      head: headLines.join('\n').trim(),
      body: bodyLines.join('\n').trim(),
    };
  }

  /**
   * 解析 Score 头部
   * 通用布局信息存入 props，ABC 特有元数据存入 meta
   * @param header - Score 头部字符串
   * @param rootMeta - 文件头元数据（可选，用于读取 %%lyricist 等指令）
   */
  private parseScoreHeader(
    header: string,
    rootMeta?: SNRootMeta,
  ): {
    id: string | null;
    meta: SNScoreMeta;
    props: SNScoreProps;
  } {
    const meta: SNScoreMeta = {};
    const props: SNScoreProps = {
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: { symbol: 'natural', letter: 'C' },
      tempo: { value: 120, unit: 'BPM' },
      timeUnit: { ticksPerWhole: 48, ticksPerBeat: 12 },
    };

    let id: string | null = null;
    const lines = header
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const fieldRegex = /^([XTCSMLQKHOAGNRZDFBV]):\s*(.*)$/;

    for (const line of lines) {
      const match = line.match(fieldRegex);
      if (!match) continue;

      const [, key, value] = match;

      switch (key) {
        case 'X':
          id = value || null;
          break;
        case 'T':
          if (!props.title) {
            props.title = value;
          } else {
            props.subtitle = value;
          }
          break;
        case 'C': {
          if (!props.contributors) {
            props.contributors = [];
          }
          // 支持在 C: 字段中使用前缀来区分作词和作曲
          // 格式：C: 作词：张三 或 C: 作曲：李四
          const lyricistMatch = value.match(/^作词[：:]\s*(.+)$/);
          const composerMatch = value.match(/^作曲[：:]\s*(.+)$/);

          if (lyricistMatch) {
            // 作词者
            props.contributors.push({
              name: lyricistMatch[1].trim(),
              role: 'lyricist' as const,
            });
          } else if (composerMatch) {
            // 作曲者
            props.contributors.push({
              name: composerMatch[1].trim(),
              role: 'composer' as const,
            });
          } else {
            // 默认作为作曲者（保持向后兼容）
            props.contributors.push({
              name: value,
              role: 'composer' as const,
            });
          }
          break;
        }
        case 'O':
          meta.origin = value;
          break;
        case 'A':
          meta.area = value;
          break;
        case 'N':
          meta.notes = value;
          break;
        case 'M': {
          const timeMatch = value.match(/^(\d+)\/(\d+)$/);
          if (timeMatch) {
            const [, num, den] = timeMatch.map(Number);
            if (num > 0 && den > 0) {
              props.timeSignature = { numerator: num, denominator: den };
              if (props.timeUnit) {
                props.timeUnit.ticksPerBeat = Math.round(
                  props.timeUnit.ticksPerWhole / den,
                );
              } else {
                props.timeUnit = {
                  ticksPerWhole: 48,
                  ticksPerBeat: Math.round(48 / den),
                };
              }
            }
          }
          break;
        }
        case 'K': {
          // 使用统一的调号解析函数，支持所有格式（包括小调简写、修饰符等）
          const keySignature = this.parseKeySignatureValue(value);
          if (keySignature) {
            props.keySignature = keySignature;
          }
          break;
        }
        case 'Q': {
          const tempoMatch = value.match(/(?:\d+\/?\d*=)?(\d+)/);
          if (tempoMatch) {
            const bpm = parseInt(tempoMatch[1], 10);
            if (!isNaN(bpm) && bpm > 0) {
              props.tempo = { value: bpm, unit: 'BPM' };
            }
          }
          break;
        }
        case 'L':
          if (/^\d+\/\d+$/.test(value)) {
            meta.noteLength = value;
            props.timeUnit = convertAbcNoteLengthToTimeUnit(
              value,
              props.timeSignature,
            );
          }
          break;
        case 'S':
          meta.copyright = value;
          break;
        case 'V': {
          // 解析声部定义 V:数字 name="名称" clef=谱号
          const voiceMatch = value.match(/^(\d+)\s*(.*)$/);
          if (voiceMatch) {
            const [, voiceNumber, metaLine] = voiceMatch;
            if (!props.voices) {
              props.voices = [];
            }
            const name =
              metaLine.match(/name="([^"]+)"/)?.[1] || `Voice ${voiceNumber}`;
            const clefMatch = metaLine.match(/clef=([a-z]+)/);
            const clef =
              (clefMatch?.[1] as 'treble' | 'bass' | 'alto' | 'tenor') ||
              'treble';
            const transposeMatch = metaLine.match(/transpose=([+-]?\d+)/);
            const transpose = transposeMatch
              ? parseInt(transposeMatch[1], 10)
              : undefined;

            // 检查是否已存在该声部定义，如果存在则更新（向上覆盖）
            const existingVoiceIndex = props.voices.findIndex(
              (v) => v.voiceNumber === voiceNumber,
            );
            if (existingVoiceIndex >= 0) {
              // 更新现有声部定义
              props.voices[existingVoiceIndex] = {
                voiceNumber,
                name,
                clef,
                transpose,
              };
            } else {
              // 添加新声部定义
              props.voices.push({
                voiceNumber,
                name,
                clef,
                transpose,
              });
            }
          }
          break;
        }
        case 'H':
        case 'G':
        case 'R':
        case 'Z':
        case 'D':
        case 'F':
        case 'B':
          if (!meta[key.toLowerCase() as keyof SNScoreMeta]) {
            (meta as Record<string, unknown>)[key.toLowerCase()] = value;
          }
          break;
      }
    }

    // 检查文件头是否有 %%lyricist 指令
    if (rootMeta?.directives?.lyricist) {
      if (!props.contributors) {
        props.contributors = [];
      }
      // 检查是否已经存在相同的作词者（避免重复）
      const existingLyricist = props.contributors.find(
        (c) =>
          c.role === 'lyricist' && c.name === rootMeta.directives!.lyricist,
      );
      if (!existingLyricist) {
        props.contributors.push({
          name: rootMeta.directives.lyricist,
          role: 'lyricist' as const,
        });
      }
    }

    return { id, meta, props };
  }

  private parseScoreBody(body: string): string[] {
    const sectionRegex = /S:.*?(?=S:|$)/gs;
    return body.match(sectionRegex) || [body];
  }

  parseSection(sectionData: string): SNParserSection {
    const sectionMatch = sectionData.match(
      /^\s*S:\s*(?<sMetaValue>.*?)(?:\r?\n|$)(?<rest>.*)$/s,
    );

    const { sMetaValue = '', rest = sectionData.trim() } =
      sectionMatch?.groups || {};

    const { headerFields, content } = this.splitSectionHeaderAndContent(rest);
    const { props, meta } = this.parseSectionHeader(headerFields, sMetaValue);

    // 第一步：从 content 中分离出 V: 定义和乐谱体
    // V: 定义是行首的 V: 开头的行，乐谱体是包含 [V:1] 标记和音符的内容
    const lines = content.split(/\r?\n/);
    const voiceHeaders: string[] = [];
    const musicBody: string[] = [];
    let foundMusicContent = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      // 如果遇到行首的 V: 定义（不是 [V:1] 这样的标记），收集为声部定义
      if (/^\s*V:\s*\d+/.test(trimmedLine) && !foundMusicContent) {
        voiceHeaders.push(trimmedLine);
      } else {
        // 一旦遇到非 V: 定义的行，后续所有内容都是乐谱体
        foundMusicContent = true;
        musicBody.push(line);
      }
    }

    const musicBodyContent = musicBody.join('\n');

    // 第二步：创建声部节点（基于 V: 定义）
    // 建立声部编号到元数据和节点的映射
    const voiceMetadataMap = new Map<
      string,
      { voiceNumber: string; metaLine: string; fullLine: string }
    >();
    const voiceNodesMap = new Map<string, SNParserVoice>();

    for (const voiceHeader of voiceHeaders) {
      const match = voiceHeader.match(/^\s*V:\s*(\d+)\s*(.*)$/);
      if (match) {
        const [, voiceNumber, metaLine] = match;
        voiceMetadataMap.set(voiceNumber, {
          voiceNumber,
          metaLine: metaLine || '',
          fullLine: voiceHeader,
        });

        // 创建声部节点（只包含元数据，不包含乐谱内容）
        // 从 V: 定义中解析所有信息
        // 注意：metaLine 可能包含前导空格，需要 trim
        const trimmedMetaLine = (metaLine || '').trim();

        // 解析 name（支持 name="..." 格式）
        const nameMatch = trimmedMetaLine.match(/name\s*=\s*"([^"]+)"/);
        const name = nameMatch?.[1] || undefined;

        // 解析 clef（支持 clef=... 格式）
        const clefMatch = trimmedMetaLine.match(/clef\s*=\s*([a-z]+)/);
        const clef: SNVoiceMetaClef | undefined =
          (clefMatch?.[1] as SNVoiceMetaClef) || undefined;

        // 解析 transpose（支持 transpose=... 格式）
        const transposeMatch = trimmedMetaLine.match(
          /transpose\s*=\s*([+-]?\d+)/,
        );
        const transpose = transposeMatch
          ? parseInt(transposeMatch[1], 10)
          : undefined;

        // 尝试从 props.voices 中获取声部定义（向上覆盖）
        // 如果 props.voices 中有该声部的定义，使用它来覆盖或补充信息
        const voiceDefinition = props.voices?.find(
          (v) => v.voiceNumber === voiceNumber,
        );

        // 合并信息：V: 定义优先，props.voices 作为补充
        // V: 定义中的值优先，如果 V: 定义中没有，则使用 props.voices 中的值
        const finalName =
          name || voiceDefinition?.name || `Voice ${voiceNumber}`;
        const finalClef = clef || voiceDefinition?.clef || 'treble';
        const finalTranspose = transpose ?? voiceDefinition?.transpose;

        const voiceId = `voice-${voiceNumber}-${finalName.toLowerCase().replace(/\W+/g, '-')}`;
        const voice = new SNParserVoice({
          id: voiceId || this.getNextId('voice'),
          originStr: voiceHeader,
        });

        // 设置完整的 meta 信息
        voice.setMeta({
          voiceNumber,
          name: finalName,
          clef: finalClef,
          transpose: finalTranspose,
        });

        voiceNodesMap.set(voiceNumber, voice);
      }
    }

    // 第三步：解析乐谱体，识别 [V:] 标记，将小节分配到对应声部
    // 如果没有任何 V: 定义，创建一个默认声部
    if (voiceNodesMap.size === 0 && musicBodyContent.trim()) {
      const defaultVoice = this.parseVoice(musicBodyContent.trim());
      return new SNParserSection({
        id: sMetaValue || this.getNextId('section'),
        originStr: sectionData,
      })
        .setMeta(meta)
        .setProps(props)
        .addChildren([defaultVoice]);
    }

    // 按小节分割乐谱体，识别 [V:] 标记
    // 将小节分配到对应的声部节点
    const voiceMeasuresMap = new Map<
      string,
      Array<{ measureData: string; voiceId?: string }>
    >();

    // 如果没有 V: 定义，但有乐谱内容，创建默认声部
    if (voiceNodesMap.size === 0) {
      const defaultVoice = this.parseVoice(musicBodyContent.trim());
      return new SNParserSection({
        id: sMetaValue || this.getNextId('section'),
        originStr: sectionData,
      })
        .setMeta(meta)
        .setProps(props)
        .addChildren([defaultVoice]);
    }

    // 解析乐谱体，按小节分割，识别 [V:] 标记
    // 移除歌词行，保留音乐内容和 [V:] 标记
    const musicContent = musicBodyContent
      .replace(/^\s*[wW]:\s*.*$/gim, '') // 移除歌词行
      .trim();

    // 按小节线分割，但保留 [V:] 标记
    const rawMeasures = musicContent
      .split('|')
      .map((measure) => measure.trim())
      .filter(Boolean);

    let currentVoiceId: string | undefined = undefined;
    // 如果没有 [V:] 标记，使用第一个声部
    if (voiceNodesMap.size > 0) {
      const firstVoiceNumber = Array.from(voiceNodesMap.keys())[0];
      currentVoiceId = firstVoiceNumber;
    }

    // 遍历所有小节，识别 [V:] 标记并分配小节
    for (const measureData of rawMeasures) {
      // 检查小节中是否有 [V:] 标记
      const voiceMatch = measureData.match(/\[\s*V:\s*(\d+)\s*\]/);
      if (voiceMatch) {
        const voiceNumber = voiceMatch[1];
        // 如果该声部存在，切换到该声部
        if (voiceNodesMap.has(voiceNumber)) {
          currentVoiceId = voiceNumber;
        } else {
          // 如果声部不存在，创建默认声部
          // 尝试从 props.voices 中获取声部定义（向上覆盖）
          const voiceDefinition = props.voices?.find(
            (v) => v.voiceNumber === voiceNumber,
          );

          const defaultVoice = new SNParserVoice({
            id: this.getNextId('voice'),
            originStr: `V:${voiceNumber}`,
          });
          defaultVoice.setMeta({
            voiceNumber,
            name: voiceDefinition?.name || `Voice ${voiceNumber}`,
            clef: voiceDefinition?.clef || 'treble',
            transpose: voiceDefinition?.transpose,
          });
          voiceNodesMap.set(voiceNumber, defaultVoice);
          currentVoiceId = voiceNumber;
        }
      }

      // 将小节分配到当前声部
      if (currentVoiceId) {
        if (!voiceMeasuresMap.has(currentVoiceId)) {
          voiceMeasuresMap.set(currentVoiceId, []);
        }
        voiceMeasuresMap.get(currentVoiceId)!.push({
          measureData,
          voiceId: voiceMatch ? currentVoiceId : undefined,
        });
      } else {
        // 如果没有当前声部，创建默认声部
        const defaultVoiceNumber = '1';
        if (!voiceNodesMap.has(defaultVoiceNumber)) {
          // 尝试从 props.voices 中获取声部定义（向上覆盖）
          const voiceDefinition = props.voices?.find(
            (v) => v.voiceNumber === defaultVoiceNumber,
          );

          const defaultVoice = new SNParserVoice({
            id: this.getNextId('voice'),
            originStr: `V:${defaultVoiceNumber}`,
          });
          defaultVoice.setMeta({
            voiceNumber: defaultVoiceNumber,
            name: voiceDefinition?.name || `Voice ${defaultVoiceNumber}`,
            clef: voiceDefinition?.clef || 'treble',
            transpose: voiceDefinition?.transpose,
          });
          voiceNodesMap.set(defaultVoiceNumber, defaultVoice);
        }
        currentVoiceId = defaultVoiceNumber;
        if (!voiceMeasuresMap.has(currentVoiceId)) {
          voiceMeasuresMap.set(currentVoiceId, []);
        }
        voiceMeasuresMap.get(currentVoiceId)!.push({
          measureData,
          voiceId: undefined,
        });
      }
    }

    // 第四步：为每个声部解析小节内容
    const voices: SNParserVoice[] = [];
    for (const [voiceNumber, measures] of voiceMeasuresMap.entries()) {
      const voice = voiceNodesMap.get(voiceNumber);
      if (voice) {
        // 解析声部的小节内容
        const parsedVoice = this.parseVoiceContent(
          voice,
          measures,
          musicBodyContent,
        );
        voices.push(parsedVoice);
      }
    }

    // 如果没有任何声部内容，创建一个默认声部
    if (voices.length === 0 && musicBodyContent.trim()) {
      voices.push(this.parseVoice(musicBodyContent.trim()));
    }

    return new SNParserSection({
      id: sMetaValue || this.getNextId('section'),
      originStr: sectionData,
    })
      .setMeta(meta)
      .setProps(props)
      .addChildren(voices);
  }

  private splitSectionHeaderAndContent(sectionContent: string): {
    headerFields: string;
    content: string;
  } {
    const lines = sectionContent.split(/\r?\n/).map((line) => line.trim());
    const headerLines: string[] = [];
    const contentLines: string[] = [];
    let isHeader = true;
    const fieldRegex = /^([TMKLQCV]):/;

    for (const line of lines) {
      if (isHeader && line && fieldRegex.test(line)) {
        headerLines.push(line);
      } else {
        isHeader = false;
        contentLines.push(line);
      }
    }

    return {
      headerFields: headerLines.join('\n'),
      content: contentLines.join('\n'),
    };
  }

  /**
   * 解析 Section 头部字段
   * 通用布局信息存入 props，ABC 特有元数据存入 meta
   */
  private parseSectionHeader(
    header: string,
    sectionId: string,
  ): {
    meta: SNSectionMeta;
    props: SNScoreProps;
  } {
    const meta: SNSectionMeta = {
      sectionId: sectionId || undefined,
    };
    const props: SNScoreProps = {
      timeUnit: { ticksPerWhole: 48, ticksPerBeat: 12 },
    };

    if (!header.trim()) {
      return { meta, props };
    }

    const lines = header
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const fieldRegex = /^([TMKLQCV]):\s*(.*)$/;

    for (const line of lines) {
      const match = line.match(fieldRegex);
      if (!match) continue;

      const [, key, value] = match;

      switch (key) {
        case 'T':
          if (!props.title) {
            props.title = value;
          } else {
            props.subtitle = value;
          }
          break;
        case 'C': {
          if (!props.contributors) {
            props.contributors = [];
          }
          // 支持在 C: 字段中使用前缀来区分作词和作曲
          // 格式：C: 作词：张三 或 C: 作曲：李四
          const lyricistMatch = value.match(/^作词[：:]\s*(.+)$/);
          const composerMatch = value.match(/^作曲[：:]\s*(.+)$/);

          if (lyricistMatch) {
            // 作词者
            props.contributors.push({
              name: lyricistMatch[1].trim(),
              role: 'lyricist' as const,
            });
          } else if (composerMatch) {
            // 作曲者
            props.contributors.push({
              name: composerMatch[1].trim(),
              role: 'composer' as const,
            });
          } else {
            // 默认作为作曲者（保持向后兼容）
            props.contributors.push({
              name: value,
              role: 'composer' as const,
            });
          }
          break;
        }
        case 'M': {
          const timeMatch = value.match(/^(\d+)\/(\d+)$/);
          if (timeMatch) {
            const [, num, den] = timeMatch.map(Number);
            if (num > 0 && den > 0) {
              props.timeSignature = { numerator: num, denominator: den };
              if (props.timeUnit) {
                props.timeUnit.ticksPerBeat = Math.round(
                  props.timeUnit.ticksPerWhole / den,
                );
              } else {
                props.timeUnit = {
                  ticksPerWhole: 48,
                  ticksPerBeat: Math.round(48 / den),
                };
              }
            }
          }
          break;
        }
        case 'K': {
          // 使用统一的调号解析函数，支持所有格式（包括小调简写、修饰符等）
          const keySignature = this.parseKeySignatureValue(value);
          if (keySignature) {
            props.keySignature = keySignature;
          }
          break;
        }
        case 'Q': {
          const tempoMatch = value.match(/(?:\d+\/?\d*=)?(\d+)/);
          if (tempoMatch) {
            const bpm = parseInt(tempoMatch[1], 10);
            if (!isNaN(bpm) && bpm > 0) {
              props.tempo = { value: bpm, unit: 'BPM' };
            }
          }
          break;
        }
        case 'L':
          if (/^\d+\/\d+$/.test(value)) {
            meta.noteLength = value;
            props.timeUnit = convertAbcNoteLengthToTimeUnit(
              value,
              props.timeSignature,
            );
          }
          break;
        case 'V': {
          // 解析声部定义 V:数字 name="名称" clef=谱号
          // Section 级别的声部定义会覆盖 Score 级别的定义（向上覆盖）
          const voiceMatch = value.match(/^(\d+)\s*(.*)$/);
          if (voiceMatch) {
            const [, voiceNumber, metaLine] = voiceMatch;
            if (!props.voices) {
              props.voices = [];
            }
            const name =
              metaLine.match(/name="([^"]+)"/)?.[1] || `Voice ${voiceNumber}`;
            const clefMatch = metaLine.match(/clef=([a-z]+)/);
            const clef =
              (clefMatch?.[1] as 'treble' | 'bass' | 'alto' | 'tenor') ||
              'treble';
            const transposeMatch = metaLine.match(/transpose=([+-]?\d+)/);
            const transpose = transposeMatch
              ? parseInt(transposeMatch[1], 10)
              : undefined;

            // 检查是否已存在该声部定义，如果存在则更新（向上覆盖）
            const existingVoiceIndex = props.voices.findIndex(
              (v) => v.voiceNumber === voiceNumber,
            );
            if (existingVoiceIndex >= 0) {
              // 更新现有声部定义（Section 覆盖 Score）
              props.voices[existingVoiceIndex] = {
                voiceNumber,
                name,
                clef,
                transpose,
              };
            } else {
              // 添加新声部定义
              props.voices.push({
                voiceNumber,
                name,
                clef,
                transpose,
              });
            }
          }
          break;
        }
      }
    }

    return { meta, props };
  }

  /**
   * 解析声部的小节内容（混合方案）
   *
   * @param voice - 声部节点（已包含元数据）
   * @param measures - 小节数据数组（包含 measureData 和 voiceId）
   * @param originalContent - 原始乐谱内容（用于解析歌词）
   * @returns 解析后的声部节点
   */
  private parseVoiceContent(
    voice: SNParserVoice,
    measures: Array<{ measureData: string; voiceId?: string }>,
    originalContent: string,
  ): SNParserVoice {
    // 解析歌词
    const lyricLines: Array<{
      verse: number;
      content: string;
      startMeasureIndex?: number;
    }> = [];
    let verseNumber = 0;

    const lines = originalContent.split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lyricMatch = line.match(/^\s*([wW]):\s*(.+)$/i);

      if (lyricMatch) {
        const isUpperCase = lyricMatch[1] === 'W';
        if (!isUpperCase) {
          verseNumber = 0;
        } else {
          verseNumber++;
        }

        let measureCountBefore = 0;
        let musicLineIndex = lineIndex - 1;
        while (
          musicLineIndex >= 0 &&
          (/^\s*[wW]:/i.test(lines[musicLineIndex]) ||
            !lines[musicLineIndex].trim())
        ) {
          musicLineIndex--;
        }

        for (let i = 0; i < musicLineIndex; i++) {
          const prevLine = lines[i];
          if (!/^\s*[wW]:/i.test(prevLine) && prevLine.trim()) {
            const lineWithoutRepeats = prevLine
              .replace(/\|:/g, '')
              .replace(/:\|/g, '');
            const measures = lineWithoutRepeats
              .split('|')
              .map((m) => m.trim())
              .filter((m) => {
                if (!m) return false;
                if (m.startsWith('[')) {
                  return /[A-Ga-g]/.test(m);
                }
                return true;
              });
            measureCountBefore += measures.length;
          }
        }

        lyricLines.push({
          verse: verseNumber,
          content: lyricMatch[2].trim(),
          startMeasureIndex: measureCountBefore,
        });
      }
    }

    // 提取该声部的小节数据（移除 [V:] 标记）
    const musicMeasures = measures
      .map((m) => {
        // 移除 [V:] 标记，保留其他内容
        return m.measureData.replace(/\[\s*V:\s*\d+\s*\]/g, '').trim();
      })
      .filter(Boolean);

    const lyricsMap = this.parseLyrics(lyricLines, musicMeasures);
    const parentTimeUnit = this.getParentTimeUnit(voice);

    // 解析小节，将 [V:] 标记计入小节元数据
    return voice.addChildren(
      measures.map((measureInfo, i) => {
        const measureData = measureInfo.measureData;
        const lyricsForMeasure = lyricsMap?.get(i) || [];
        return this.parseMeasure(
          measureData,
          i + 1,
          lyricsForMeasure,
          parentTimeUnit,
          measureInfo.voiceId, // 传递 voiceId 到 parseMeasure
        );
      }),
    );
  }

  parseVoice(voiceData: string): SNParserVoice {
    const voiceMatch = voiceData.match(
      /^\s*V:\s*(\d+)\s*(?<metaLine>.*?)(?:\r?\n|$)(?<measuresContent>.*)$/s,
    );

    const { metaLine = '', measuresContent = voiceData.trim() } =
      voiceMatch?.groups || {};

    // 如果正则匹配失败，尝试从 voiceData 中提取 voiceNumber
    // 这种情况不应该发生，但如果发生了，应该使用默认值而不是随机数
    let voiceNumber = '1';
    if (voiceMatch) {
      voiceNumber = voiceMatch[1];
    } else {
      // 尝试从 voiceData 中查找 V:数字 格式
      const fallbackMatch = voiceData.match(/V:\s*(\d+)/);
      if (fallbackMatch) {
        voiceNumber = fallbackMatch[1];
      } else {
        // 如果完全找不到，使用默认值 "1" 而不是随机数
        voiceNumber = '1';
      }
    }

    // 从 V: 定义中解析所有信息
    const name = (
      metaLine.match(/name="([^"]+)"/)?.[1] || `Voice ${voiceNumber}`
    ).trim();
    const clefMatch = metaLine.match(/clef=([a-z]+)/);
    const clef: SNVoiceMetaClef =
      (clefMatch?.[1] as SNVoiceMetaClef) || 'treble';
    const transposeMatch = metaLine.match(/transpose=([+-]?\d+)/);
    const transpose = transposeMatch
      ? parseInt(transposeMatch[1], 10)
      : undefined;

    const id = `voice-${voiceNumber}-${name.toLowerCase().replace(/\W+/g, '-')}`;
    const voice = new SNParserVoice({
      id: id || this.getNextId('voice'),
      originStr: voiceData,
    });

    // 设置完整的 meta 信息
    voice.setMeta({
      voiceNumber,
      name,
      clef,
      transpose,
    });

    const lyricLines: Array<{
      verse: number;
      content: string;
      startMeasureIndex?: number;
    }> = [];
    let verseNumber = 0;

    // 移除乐谱体中的 [V:1] 这样的声部标记，这些标记不应该被处理
    // 同时移除歌词行，以便后续处理
    // 注意：需要移除 [V:1] 但保留其他元数据标记如 [K:C]
    const musicContent = measuresContent
      .replace(/\[\s*V:\s*\d+\s*\]/g, '') // 移除 [V:1] 这样的标记
      .replace(/^\s*[wW]:\s*.*$/gim, '') // 移除歌词行
      .trim();

    const rawMeasures = musicContent
      .split('|')
      .map((measure) => measure.trim())
      .filter(Boolean);

    const metadataMeasures: string[] = [];
    const musicMeasures: string[] = [];
    const metaPattern = /^\[([KMTL]:|key|meter|title|tempo).*]$/i;
    rawMeasures.forEach((measure) => {
      if (metaPattern.test(measure)) {
        metadataMeasures.push(measure);
      } else {
        musicMeasures.push(measure);
      }
    });

    const lines = measuresContent.split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lyricMatch = line.match(/^\s*([wW]):\s*(.+)$/i);

      if (lyricMatch) {
        const isUpperCase = lyricMatch[1] === 'W';
        if (!isUpperCase) {
          verseNumber = 0;
        } else {
          verseNumber++;
        }

        let measureCountBefore = 0;
        let musicLineIndex = lineIndex - 1;
        while (
          musicLineIndex >= 0 &&
          (/^\s*[wW]:/i.test(lines[musicLineIndex]) ||
            !lines[musicLineIndex].trim())
        ) {
          musicLineIndex--;
        }

        for (let i = 0; i < musicLineIndex; i++) {
          const prevLine = lines[i];
          if (!/^\s*[wW]:/i.test(prevLine) && prevLine.trim()) {
            const lineWithoutRepeats = prevLine
              .replace(/\|:/g, '')
              .replace(/:\|/g, '');
            const measures = lineWithoutRepeats
              .split('|')
              .map((m) => m.trim())
              .filter((m) => {
                if (!m) return false;
                if (m.startsWith('[')) {
                  return /[A-Ga-g]/.test(m);
                }
                return true;
              });
            measureCountBefore += measures.length;
          }
        }

        lyricLines.push({
          verse: verseNumber,
          content: lyricMatch[2].trim(),
          startMeasureIndex: measureCountBefore,
        });
      }
    }

    const lyricsMap = this.parseLyrics(lyricLines, musicMeasures);
    const parentTimeUnit = this.getParentTimeUnit(voice);

    // 行内调号标记 [K:C] 应该属于小节级别，而不是声部级别
    // 如果第一个小节之前有 [K:C] 标记，会在 parseMeasure 中解析并存储到小节的 props 中
    // 这里不再将 metadataMeasures 中的 [K:C] 解析为声部级别的调号

    return voice
      .setMeta({
        voiceNumber,
        name,
        clef,
        transpose,
      })
      .addChildren(
        musicMeasures.map((measureData, i) => {
          const lyricsForMeasure = lyricsMap?.get(i) || [];
          // 如果这是第一个小节，且 metadataMeasures 中有调号标记，将其合并到小节数据中
          let measureDataWithKey = measureData;
          if (i === 0 && metadataMeasures.length > 0) {
            // 检查是否有 [K:...] 标记
            const keyMetadata = metadataMeasures.find((m) =>
              m.startsWith('[K:'),
            );
            if (keyMetadata) {
              // 将调号标记添加到第一个小节数据的前面
              measureDataWithKey = `${keyMetadata} ${measureData}`;
            }
          }
          return this.parseMeasure(
            measureDataWithKey,
            i + 1,
            lyricsForMeasure,
            parentTimeUnit,
          );
        }),
      );
  }

  private getParentTimeUnit(node: SNParserNode): SNTimeUnit | undefined {
    let current: SNParserNode | undefined = node.parent;
    while (current) {
      const props = current.props as SNMusicProps | undefined;
      if (props?.timeUnit) {
        return props.timeUnit;
      }
      current = current.parent;
    }
    return undefined;
  }

  private getDefaultNoteLength(
    _elementData: string,
    node?: SNParserNode,
  ): number {
    if (node) {
      let current: SNParserNode | undefined = node.parent;
      while (current) {
        const meta = current.meta as { noteLength?: string } | undefined;
        if (meta?.noteLength) {
          const match = meta.noteLength.match(/^(\d+)\/(\d+)$/);
          if (match) {
            const [, num, den] = match.map(Number);
            return num / den;
          }
        }
        current = current.parent;
      }
    }
    return 1 / 4;
  }

  parseMeasure(
    measureData: string,
    index: number,
    lyricsForMeasure?: Array<{
      syllable: string;
      alignmentType: SNLyricAlignmentType;
      skip: boolean;
      verse: number;
    }>,
    parentTimeUnit?: SNTimeUnit,
    voiceId?: string, // 行内声部标记 [V:数字]
  ): SNParserMeasure {
    // 解析行内调号标记 [K:C]（出现在小节线之前）
    const keySignature = this.parseKeySignature(measureData);

    // 解析行内声部标记 [V:数字]（出现在小节线之前）
    const voiceMatch = measureData.match(/\[\s*V:\s*(\d+)\s*\]/);
    const measureVoiceId = voiceMatch ? voiceMatch[1] : voiceId;

    const barline = this.parseBarline(measureData);
    const elementsData = measureData.replace(':', '');

    const measure = new SNParserMeasure({
      id: this.getNextId('measure'),
      index,
      originStr: measureData,
    });

    // 构建小节的元数据
    const measureMeta: SNMeasureMeta = {
      barline,
    };

    // 如果小节数据中包含行内声部标记，将其存储到小节的 meta 中
    if (measureVoiceId) {
      measureMeta.voiceId = measureVoiceId;
    }

    // 如果小节数据中包含行内调号标记，将其存储到小节的 props 中
    if (keySignature) {
      measure.props = {
        keySignature,
      };
    }

    const timeUnit = parentTimeUnit || getTimeUnitFromNode(measure);
    const elements = this.parseElements(
      elementsData,
      lyricsForMeasure,
      timeUnit,
    );

    let currentPosition = 0;
    const elementsWithPosition = elements.map((element) => {
      if (element.duration !== undefined) {
        const startPosition = calculateStartPosition(currentPosition);
        const endPosition = calculateEndPosition(
          startPosition,
          element.duration,
        );
        (element as any).startPosition = startPosition;
        (element as any).endPosition = endPosition;
        currentPosition = endPosition;
      }
      return element;
    });

    const timeSignature = this.getParentTimeSignature(measure) || {
      numerator: 4,
      denominator: 4,
    };

    if (timeUnit) {
      const validation = validateMeasureDuration(
        currentPosition,
        timeSignature,
        timeUnit,
      );
      if (!validation.valid) {
        console.warn(
          `Measure ${index} duration validation failed: ${validation.error}`,
        );
      }
    }

    return measure.setMeta(measureMeta).addChildren(elementsWithPosition);
  }

  private getParentTimeSignature(
    node: SNParserNode,
  ): SNTimeSignature | undefined {
    let current: SNParserNode | undefined = node.parent;
    while (current) {
      const props = current.props as SNMusicProps | undefined;
      if (props?.timeSignature) {
        return props.timeSignature;
      }
      current = current.parent;
    }
    return undefined;
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

  /**
   * 解析调号值（统一处理所有格式）
   * 支持格式：
   * - C, C#, Cb (基本格式)
   * - C major, C minor (带关键字)
   * - Amin, Am (小调简写)
   * - 忽略修饰符（clef=, instrument=, octave=, shift-score=, shift-sound=）
   *
   * @param value - 调号字符串（不包含 K: 前缀和方括号）
   * @returns 调号对象，如果解析失败返回 undefined
   */
  private parseKeySignatureValue(value: string): SNKeySignature | undefined {
    if (!value || !value.trim()) return undefined;

    // 移除修饰符（clef=, instrument=, octave=, shift-score=, shift-sound=）
    // 只保留调号部分（第一个空格或修饰符之前的内容）
    const keyPart = value
      .split(/\s+(?:clef|instrument|octave|shift-score|shift-sound)=/i)[0]
      .trim();

    if (!keyPart) return undefined;

    // 1. 匹配基本格式：C, C#, Cb
    const basicMatch = keyPart.match(/^([A-Ga-g])([#b])?$/);
    if (basicMatch) {
      const [, letter, accidental] = basicMatch;
      return {
        letter: letter.toUpperCase(),
        symbol:
          accidental === '#'
            ? 'sharp'
            : accidental === 'b'
              ? 'flat'
              : 'natural',
      };
    }

    // 2. 匹配带关键字的格式：C major, C minor, C# major, Cb minor
    const withKeywordMatch = keyPart.match(
      /^([A-Ga-g])([#b])?\s+(major|minor|m)$/i,
    );
    if (withKeywordMatch) {
      const [, letter, accidental] = withKeywordMatch;
      return {
        letter: letter.toUpperCase(),
        symbol:
          accidental === '#'
            ? 'sharp'
            : accidental === 'b'
              ? 'flat'
              : 'natural',
      };
    }

    // 3. 匹配小调简写格式：Amin, Am, C#min, C#m
    const minorShortMatch = keyPart.match(/^([A-Ga-g])([#b])?(min|m)$/i);
    if (minorShortMatch) {
      const [, letter, accidental] = minorShortMatch;
      return {
        letter: letter.toUpperCase(),
        symbol:
          accidental === '#'
            ? 'sharp'
            : accidental === 'b'
              ? 'flat'
              : 'natural',
      };
    }

    // 4. 匹配单独的关键字格式：major, minor（这种情况很少见，但为了完整性）
    if (/^(major|minor)$/i.test(keyPart)) {
      // 如果只有关键字没有字母，无法确定调号，返回 undefined
      return undefined;
    }

    return undefined;
  }

  /**
   * 解析行内调号标记 [K:...]
   * 支持格式：
   * - [K:C]
   * - [K:C#]
   * - [K:Cb]
   * - [K:C major]
   * - [K:C minor]
   * - [K:Amin]
   * - [K:Am]
   *
   * @param content - 包含调号标记的字符串
   * @returns 调号对象，如果解析失败返回 undefined
   */
  private parseKeySignature(content: string): SNKeySignature | undefined {
    // 匹配 [K:...] 格式，支持方括号内的所有内容
    const keyMatch = content.match(/\[K:([^\]]+)\]/);
    if (!keyMatch) return undefined;

    const keyValue = keyMatch[1].trim();
    return this.parseKeySignatureValue(keyValue);
  }

  parseElements(
    elementsData: string,
    lyricsForMeasure?: Array<{
      syllable: string;
      alignmentType: SNLyricAlignmentType;
      skip: boolean;
      verse: number;
    }>,
    timeUnit?: SNTimeUnit,
  ): SNParserNode[] {
    const tokens = this.tokenizeMeasure(elementsData);
    const elements: SNParserNode[] = [];
    let elementIndex = 0;

    for (const token of tokens) {
      try {
        const element = this.parseElement(token, timeUnit);
        if (element) {
          elements.push(element);

          if (lyricsForMeasure && this.isElementSupportLyric(element.type)) {
            const lyricInfo = lyricsForMeasure[elementIndex];

            if (lyricInfo) {
              if (!lyricInfo.skip) {
                const lyric = new SNParserLyric({
                  id: this.getNextId('lyric'),
                  originStr: lyricInfo.syllable,
                  targetId: element.id,
                  targetType: element.type as
                    | 'note'
                    | 'rest'
                    | 'tuplet'
                    | 'tie'
                    | 'chord',
                  syllable: lyricInfo.syllable,
                  alignmentType: lyricInfo.alignmentType,
                  skip: lyricInfo.skip,
                  verseNumber: lyricInfo.verse,
                });
                element.addChildren(lyric);
              }
              elementIndex++;
            } else {
              elementIndex++;
            }

            if (element.type === 'tuplet') {
              const tuplet = element as SNParserTuplet;
              const tupletNotes = (tuplet.children || []).filter((c) =>
                this.isElementSupportLyric(c.type),
              );
              elementIndex--;
              if (lyricsForMeasure) {
                tupletNotes.forEach((note) => {
                  if (this.isElementSupportLyric(note.type)) {
                    const lyricInfo = lyricsForMeasure[elementIndex];
                    if (lyricInfo && !lyricInfo.skip) {
                      const lyric = new SNParserLyric({
                        id: this.getNextId('lyric'),
                        originStr: lyricInfo.syllable,
                        targetId: note.id,
                        targetType: note.type as
                          | 'note'
                          | 'rest'
                          | 'tuplet'
                          | 'tie'
                          | 'chord',
                        syllable: lyricInfo.syllable,
                        alignmentType: lyricInfo.alignmentType,
                        skip: lyricInfo.skip,
                        verseNumber: lyricInfo.verse,
                      });
                      note.addChildren(lyric);
                    }
                    elementIndex++;
                  }
                });
              } else {
                elementIndex += tupletNotes.length;
              }
            }
          } else if (element.type === 'tuplet') {
            const tuplet = element as SNParserTuplet;
            const tupletNotes = (tuplet.children || []).filter((c) =>
              this.isElementSupportLyric(c.type),
            );
            elementIndex += tupletNotes.length;
          } else if (this.isElementSupportLyric(element.type)) {
            elementIndex++;
          }
        }
      } catch {
        console.warn(`Skipping unsupported element: ${token}`);
      }
    }

    return elements;
  }

  private isElementSupportLyric(
    type: string,
  ): type is 'note' | 'rest' | 'tuplet' | 'tie' | 'chord' {
    return ['note', 'rest', 'tuplet', 'tie', 'chord'].includes(type);
  }

  parseElement(elementData: string, timeUnit?: SNTimeUnit): SNParserElement {
    const trimmed = elementData.trim();

    if (!trimmed) throw new Error('Empty element');

    if (trimmed === '-') {
      return new SNParserTie({
        id: this.getNextId('tie'),
        style: 'slur',
        originStr: elementData,
      });
    }

    const tupletMatch = trimmed.match(/^\((\d+)([\s\S]*?)\)?$/);
    if (tupletMatch) {
      const [, , innerNotesStr] = tupletMatch;
      const innerNotes = this.tokenizeMeasure(innerNotesStr);

      return new SNParserTuplet({
        id: this.getNextId('tuplet'),
        originStr: elementData,
      }).addChildren(
        innerNotes.map(
          (noteStr): SNParserNote =>
            this.parseElement(noteStr, timeUnit) as SNParserNote,
        ),
      );
    }

    if (trimmed.startsWith('z')) {
      let duration: number;

      if (timeUnit) {
        const defaultNoteLength = this.getDefaultNoteLength(trimmed);
        const restStr = trimmed.slice(1);
        const durationStr = restStr.match(/^(\d+)/)?.[1];
        const dotCount = (restStr.match(/\./g) || []).length;

        const noteValue = durationStr
          ? 1 / parseInt(durationStr, 10)
          : defaultNoteLength;
        const dottedNoteValue =
          dotCount > 0
            ? noteValue * (1 + 0.5 * (1 - Math.pow(0.5, dotCount)))
            : noteValue;

        duration = noteValueToDuration(dottedNoteValue, timeUnit);
      } else {
        duration = parseInt(trimmed.slice(1), 10) || 1;
      }

      return new SNParserRest({
        id: this.getNextId('rest'),
        duration,
        originStr: elementData,
      });
    }

    const noteMatch = trimmed.match(
      /^(\^+\/?|_+\/?|=?)([A-Ga-g])([,']*)(\d*)(\.*)$/,
    );
    if (noteMatch) {
      const [, accidentalStr, letter, octaveSymbols, durationStr] = noteMatch;

      let accidental: SNAccidental = SNAccidental.NATURAL;
      if (accidentalStr) {
        switch (accidentalStr) {
          case '^':
            accidental = SNAccidental.SHARP;
            break;
          case '^^':
            accidental = SNAccidental.DOUBLE_SHARP;
            break;
          case '_':
            accidental = SNAccidental.FLAT;
            break;
          case '__':
            accidental = SNAccidental.DOUBLE_FLAT;
            break;
          case '=':
            accidental = SNAccidental.NATURAL;
            break;
          default:
            accidental = SNAccidental.NATURAL;
        }
      }

      const baseOctave: number = letter === letter.toUpperCase() ? 3 : 4;
      const octaveOffset = octaveSymbols.split('').reduce((offset, sym) => {
        return sym === ',' ? offset - 1 : sym === "'" ? offset + 1 : offset;
      }, 0);
      const octave = baseOctave + octaveOffset;

      let duration: number;

      if (timeUnit) {
        const defaultNoteLength = this.getDefaultNoteLength(trimmed);
        const noteValue = durationStr
          ? 1 / parseInt(durationStr, 10)
          : defaultNoteLength;

        const dotCount = (trimmed.match(/\./g) || []).length;
        const dottedNoteValue =
          dotCount > 0
            ? noteValue * (1 + 0.5 * (1 - Math.pow(0.5, dotCount)))
            : noteValue;

        duration = noteValueToDuration(dottedNoteValue, timeUnit);
      } else {
        duration = durationStr ? parseInt(durationStr, 10) : 1;
      }

      return new SNParserNote({
        id: this.getNextId('note'),
        originStr: trimmed,
        pitch: {
          letter: letter.toUpperCase(),
          octave,
          accidental,
        },
        duration,
      });
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

  /**
   * 解析歌词行（w: 和 W: 字段）
   * 支持音节分割(-)、多音节单词(\-)、多词同音符(~)、延长音(_)、跳过(*)等符号
   */
  private parseLyrics(
    lyricLines: Array<{
      verse: number;
      content: string;
      startMeasureIndex?: number;
    }>,
    _musicMeasures: string[],
  ): Map<
    number,
    Array<{
      syllable: string;
      alignmentType: SNLyricAlignmentType;
      skip: boolean;
      verse: number;
    }>
  > {
    const lyricsMap = new Map<
      number,
      Array<{
        syllable: string;
        alignmentType: SNLyricAlignmentType;
        skip: boolean;
        verse: number;
      }>
    >();

    if (lyricLines.length === 0) {
      return lyricsMap;
    }

    lyricLines.forEach(({ verse, content, startMeasureIndex = 0 }) => {
      const lyricSections = content.split('|').map((s) => s.trim());

      lyricSections.forEach((section, sectionIndex) => {
        if (!section) return;

        const syllables = this.parseLyricSection(section, verse);

        if (syllables.length > 0) {
          const actualMeasureIndex = startMeasureIndex + sectionIndex;
          const existing = lyricsMap.get(actualMeasureIndex) || [];
          lyricsMap.set(actualMeasureIndex, [...existing, ...syllables]);
        }
      });
    });

    return lyricsMap;
  }

  private parseLyricSection(
    section: string,
    verse: number,
  ): Array<{
    syllable: string;
    alignmentType: SNLyricAlignmentType;
    skip: boolean;
    verse: number;
  }> {
    const result: Array<{
      syllable: string;
      alignmentType: SNLyricAlignmentType;
      skip: boolean;
      verse: number;
    }> = [];

    const tokens = section.split(/(\s+)/).filter((t) => t.trim());

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].trim();
      if (!token) continue;

      if (token === '*') {
        result.push({
          syllable: '',
          alignmentType: 'skip',
          skip: true,
          verse,
        });
      } else if (token === '_') {
        continue;
      } else if (token.startsWith('\\-')) {
        const syllable = token.replace(/^\\-/, '').replace(/-/g, '');
        result.push({
          syllable,
          alignmentType: 'multi-syllable',
          skip: false,
          verse,
        });
      } else if (token.includes('~')) {
        const words = token.split('~').filter(Boolean);
        const syllable = words.join(' ');
        result.push({
          syllable,
          alignmentType: 'multi-word',
          skip: false,
          verse,
        });
      } else if (token.includes('-') && !token.startsWith('\\-')) {
        const parts = token.split('-').filter(Boolean);
        parts.forEach((part) => {
          result.push({
            syllable: part,
            alignmentType: 'syllable-split',
            skip: false,
            verse,
          });
        });
      } else {
        result.push({
          syllable: token,
          alignmentType: 'normal',
          skip: false,
          verse,
        });
      }
    }

    return result;
  }
}
