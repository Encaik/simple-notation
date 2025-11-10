import { SNAbcInput, SNParserElement, SNRootMeta } from '@data/model';
import { BaseParser } from '@data/parser';
import {
  SNParserRoot,
  SNParserScore,
  SNParserSection,
  SNParserVoice,
  SNParserMeasure,
  SNParserNode,
} from '@data/node';
import { SNTimeUnit } from '@core/model/ticks';
import { SNVoiceMetaClef } from '@data/model';
import { AbcHeaderParser, AbcMeasureParser, AbcLyricParser } from './abc';

/**
 * ABC 解析器主类
 *
 * 使用拆分后的专门解析器完成解析工作
 */
export class AbcParser extends BaseParser<SNAbcInput> {
  private currentId = 0;
  private headerParser: AbcHeaderParser;
  private measureParser: AbcMeasureParser;
  private lyricParser: AbcLyricParser;

  constructor() {
    super();
    this.headerParser = new AbcHeaderParser();
    this.measureParser = new AbcMeasureParser(this.getNextId.bind(this));
    this.lyricParser = new AbcLyricParser();
  }

  /**
   * 生成下一个ID
   */
  private getNextId(prefix: string): string {
    this.currentId++;
    return `${prefix}-${this.currentId}`;
  }

  /**
   * 主解析入口
   */
  parse(data: SNAbcInput): SNParserRoot {
    return this.parseRoot(data);
  }

  /**
   * 解析 Root（文件级别）
   *
   * 处理文件头（%% 指令）和多个 tune（每个以 X: 开头）
   */
  parseRoot(scoreCollectionData: string): SNParserRoot {
    const { fileHeader, tunesData } =
      this.splitFileHeaderAndTunes(scoreCollectionData);
    const parsedFileHeader = this.headerParser.parseFileHeader(fileHeader);

    // 提取所有 tune（以 X: 开头）
    const scoreRegex = /X:.*?(?=X:|$)/gs;
    const scores = (tunesData.match(scoreRegex) || [])
      .map((score) => score.trim())
      .filter((score) => score.length > 0);

    // 如果没有找到 X: 标记，将整个内容作为一个 tune
    if (scores.length === 0 && tunesData.trim().length > 0) {
      scores.push(tunesData.trim());
    }

    // 创建 Root 节点
    const root = new SNParserRoot({
      id: this.getNextId('root'),
      originStr: scoreCollectionData,
    });

    // 设置元数据
    if (parsedFileHeader) {
      parsedFileHeader.tuneCount = scores.length;
      root.setMeta(parsedFileHeader);
    } else if (scores.length > 0) {
      root.setMeta({ tuneCount: scores.length });
    }

    // 解析每个 tune 并添加为子节点
    return root.addChildren(
      scores.map((scoreData) =>
        this.parseScore(scoreData, parsedFileHeader || undefined),
      ),
    );
  }

  /**
   * 分割文件头和 tunes 数据
   */
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
   * 解析 Score
   */
  parseScore(scoreData: string, rootMeta?: SNRootMeta): SNParserScore {
    const { head, body } = this.splitScoreHeadAndBody(scoreData);
    const { id, meta, props } = this.headerParser.parseScoreHeader(
      head,
      rootMeta,
    );
    const sections = this.parseScoreBody(body);

    const score = new SNParserScore({
      id: id || this.getNextId('score'),
      originStr: scoreData,
    })
      .setMeta(meta)
      .setProps(props);

    // 解析 Section
    const sectionNodes = sections.map((sectionData) =>
      this.parseSection(sectionData),
    );

    return score.addChildren(sectionNodes);
  }

  /**
   * 分割 Score 头部和主体
   */
  private splitScoreHeadAndBody(scoreData: string): {
    head: string;
    body: string;
  } {
    // 检查是否有 S: 标记（Section 标记）
    const sMarkerMatch = scoreData.match(/(?=\s*S:\d+\b)/s);
    if (sMarkerMatch) {
      const splitIndex = sMarkerMatch.index || 0;
      return {
        head: scoreData.slice(0, splitIndex).trimEnd(),
        body: scoreData.slice(splitIndex).trimStart(),
      };
    }

    // 如果没有 S: 标记，按行分割
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
   * 解析 Score 主体（分割 Section）
   */
  private parseScoreBody(body: string): string[] {
    const sectionRegex = /S:.*?(?=S:|$)/gs;
    return body.match(sectionRegex) || [body];
  }

  /**
   * 解析 Section
   *
   * TODO: 这个方法比较复杂，需要处理声部解析逻辑
   * 当前保留原有实现，后续可以进一步拆分为 AbcVoiceParser
   */
  parseSection(sectionData: string): SNParserSection {
    const sectionMatch = sectionData.match(
      /^\s*S:\s*(?<sMetaValue>.*?)(?:\r?\n|$)(?<rest>.*)$/s,
    );

    const { sMetaValue = '', rest = sectionData.trim() } =
      sectionMatch?.groups || {};

    const { headerFields, content } = this.splitSectionHeaderAndContent(rest);
    const { props, meta } = this.headerParser.parseSectionHeader(
      headerFields,
      sMetaValue,
    );

    // 创建默认声部并解析
    const voice = this.parseVoice(content);

    return new SNParserSection({
      id: sMetaValue || this.getNextId('section'),
      originStr: sectionData,
    })
      .setMeta(meta)
      .setProps(props)
      .addChildren([voice]);
  }

  /**
   * 分割 Section 头部和内容
   */
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
   * 解析 Voice
   *
   * TODO: 这个方法较复杂，包含声部解析、歌词提取、小节解析等逻辑
   * 保留原有实现，后续可以进一步拆分
   */
  parseVoice(voiceData: string): SNParserVoice {
    const voiceMatch = voiceData.match(
      /^\s*V:\s*(\d+)\s*(?<metaLine>.*?)(?:\r?\n|$)(?<measuresContent>.*)$/s,
    );

    const { metaLine = '', measuresContent = voiceData.trim() } =
      voiceMatch?.groups || {};

    let voiceNumber = '1';
    if (voiceMatch) {
      voiceNumber = voiceMatch[1];
    } else {
      const fallbackMatch = voiceData.match(/V:\s*(\d+)/);
      if (fallbackMatch) {
        voiceNumber = fallbackMatch[1];
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

    // 提取歌词
    const lyricLines = this.lyricParser.extractLyricLines(measuresContent);

    // 移除声部标记、歌词行和注释行
    const musicContent = measuresContent
      .replace(/\[\s*V:\s*\d+\s*\]/g, '')
      .replace(/^\s*[wW]:\s*.*$/gim, '')
      .replace(/^\s*%.*$/gim, '') // 移除注释行
      .trim();

    // 分割小节
    const musicMeasures = musicContent
      .split('|')
      .map((measure) => measure.trim())
      .filter(Boolean)
      .filter((measure) => this.isValidMeasure(measure));

    // 解析歌词
    const lyricsMap = this.lyricParser.parseLyrics(lyricLines, musicMeasures);

    // 获取父节点的时间单位
    const parentTimeUnit = this.getParentTimeUnit(voice);

    // 解析小节
    return voice.addChildren(
      musicMeasures.map((measureData, i) => {
        const lyricsForMeasure = lyricsMap?.get(i) || [];
        return this.measureParser.parseMeasure(
          measureData,
          i + 1,
          lyricsForMeasure,
          parentTimeUnit,
        );
      }),
    );
  }

  /**
   * 判断是否为有效的小节
   *
   * 有效的小节应该包含实际的音乐内容（音符、休止符等），
   * 而不是只包含行内标记（如 [K:C]、[V:1]、[M:4/4] 等）
   *
   * @param measureData - 小节数据字符串
   * @returns 是否为有效小节
   */
  private isValidMeasure(measureData: string): boolean {
    // 移除所有行内标记
    const withoutInlineFields = measureData
      .replace(/\[[A-Za-z]:[^\]]*\]/g, '')
      .trim();

    // 移除小节线标记
    const withoutBarlines = withoutInlineFields.replace(/^:|:$/g, '').trim();

    // 如果移除行内标记和小节线后还有内容，说明包含实际音乐内容
    if (withoutBarlines.length > 0) {
      return true;
    }

    // 如果只剩空白，说明这不是有效的小节
    return false;
  }

  /**
   * 从父节点获取时间单位
   */
  private getParentTimeUnit(node: SNParserNode): SNTimeUnit | undefined {
    let current: SNParserNode | undefined = node.parent;
    while (current) {
      const props = current.props as any;
      if (props?.timeUnit) {
        return props.timeUnit;
      }
      current = current.parent;
    }
    return undefined;
  }

  /**
   * 解析 Measure
   *
   * 委托给 MeasureParser
   */
  parseMeasure(measureData: string, index: number): SNParserMeasure {
    return this.measureParser.parseMeasure(measureData, index);
  }

  /**
   * 解析 Element
   *
   * 委托给 ElementParser（通过 MeasureParser）
   */
  parseElement(_elementData: string): SNParserElement {
    // 这个方法主要用于满足 BaseParser 的接口要求
    // 实际解析工作由 ElementParser 完成
    throw new Error('请使用 MeasureParser.parseElements 进行元素解析');
  }
}
