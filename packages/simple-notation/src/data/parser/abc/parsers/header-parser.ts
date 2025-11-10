import { SNRootMeta, SNScoreMeta, SNSectionMeta } from '@data/model/abc';
import { SNScoreProps } from '@data/model/props';
import { KeySignatureParser, AbcFieldParser, TimeConverter } from '../utils';

/**
 * ABC 头部解析器
 *
 * 职责：解析 ABC 格式的头部信息
 * - 文件头（Root Meta）
 * - Score 头部
 * - Section 头部
 *
 * 设计理念：
 * - 通用布局信息存入 props（所有解析器都可能有的字段）
 * - ABC 特有元数据存入 meta（ABC 特有的字段）
 */
export class AbcHeaderParser {
  /**
   * 解析文件头元数据
   *
   * 处理 %% 开头的指令和注释
   * 支持 %%abc-2.1、%%abc 2.1、%%encoding utf-8 等格式
   *
   * @param header - 文件头字符串
   * @returns 文件头元数据或 undefined
   *
   * @example
   * ```typescript
   * const header = `
   * %%abc-2.1
   * %%encoding utf-8
   * % This is a comment
   * `;
   * const rootMeta = parser.parseFileHeader(header);
   * // { version: '2.1', encoding: 'utf-8', comments: ['This is a comment'], directives: {} }
   * ```
   */
  parseFileHeader(header: string): SNRootMeta | undefined {
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

      // 解析指令（%% 开头）
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

      // 解析注释（% 开头，但不是 %%）
      if (line.startsWith('%') && !line.startsWith('%%')) {
        rootMeta.comments!.push(line.slice(1).trim());
        continue;
      }

      // 其他非字段行（如空行、普通文本）
      if (line.length > 0 && !line.match(/^[A-Z]:/)) {
        rootMeta.comments!.push(line);
      }
    }

    // 如果没有任何有效内容，返回 undefined
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

  /**
   * 解析 Score 头部
   *
   * @param header - Score 头部字符串
   * @param rootMeta - 文件头元数据（可选，用于读取 %%lyricist 等指令）
   * @returns 解析结果（id、meta、props）
   *
   * @example
   * ```typescript
   * const header = `
   * X: 1
   * T: 小星星
   * C: 作曲：莫扎特
   * M: 4/4
   * K: C
   * `;
   * const result = parser.parseScoreHeader(header);
   * // {
   * //   id: '1',
   * //   meta: {},
   * //   props: {
   * //     title: '小星星',
   * //     contributors: [{ name: '莫扎特', role: 'composer' }],
   * //     timeSignature: { numerator: 4, denominator: 4 },
   * //     keySignature: { letter: 'C', symbol: 'natural' }
   * //   }
   * // }
   * ```
   */
  parseScoreHeader(
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

    // 使用通用解析方法
    for (const line of lines) {
      const parsed = this.parseHeaderLine(line, meta, props);
      if (parsed.id) {
        id = parsed.id;
      }
    }

    // 检查文件头是否有 %%lyricist 指令
    this.applyRootMetaToProps(rootMeta, props);

    return { id, meta, props };
  }

  /**
   * 解析 Section 头部
   *
   * @param header - Section 头部字符串
   * @param sectionId - Section ID
   * @returns 解析结果（meta、props）
   */
  parseSectionHeader(
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

    // 使用通用解析方法（复用 Score 的逻辑）
    for (const line of lines) {
      this.parseHeaderLine(line, meta, props);
    }

    return { meta, props };
  }

  /**
   * 解析单行头部字段（通用方法）
   *
   * 消除 Score 和 Section 头部解析的代码重复
   *
   * @param line - 头部行
   * @param meta - 元数据对象
   * @param props - 属性对象
   * @returns 解析结果（可能包含 id）
   */
  private parseHeaderLine(
    line: string,
    meta: SNScoreMeta | SNSectionMeta,
    props: SNScoreProps,
  ): { id?: string } {
    const fieldRegex = /^([XTCSMLQKHOAGNRZDFBVP]):\s*(.*)$/;
    const match = line.match(fieldRegex);
    if (!match) return {};

    const [, key, value] = match;
    const result: { id?: string } = {};

    switch (key) {
      case 'X':
        result.id = value || undefined;
        break;

      case 'T': {
        const titleResult = AbcFieldParser.parseTitle(value, props.title);
        if (titleResult.title) {
          props.title = titleResult.title;
        } else if (titleResult.subtitle) {
          props.subtitle = titleResult.subtitle;
        }
        break;
      }

      case 'C':
        if (!props.contributors) {
          props.contributors = [];
        }
        props.contributors.push(AbcFieldParser.parseContributor(value));
        break;

      case 'M': {
        const timeSignature = AbcFieldParser.parseTimeSignature(value);
        if (timeSignature) {
          props.timeSignature = timeSignature;
          // 更新 timeUnit
          if (props.timeUnit) {
            props.timeUnit = TimeConverter.updateTicksPerBeat(
              props.timeUnit,
              timeSignature.denominator,
            );
          }
        }
        break;
      }

      case 'K': {
        const keySignature = KeySignatureParser.parse(value);
        if (keySignature) {
          props.keySignature = keySignature;
        }
        break;
      }

      case 'Q': {
        const tempo = AbcFieldParser.parseTempo(value);
        if (tempo) {
          props.tempo = tempo;
        }
        break;
      }

      case 'L':
        if (/^\d+\/\d+$/.test(value)) {
          (meta as SNScoreMeta).noteLength = value;
          props.timeUnit = TimeConverter.convertAbcNoteLengthToTimeUnit(
            value,
            props.timeSignature,
          );
        }
        break;

      case 'V': {
        const voiceDefinition = AbcFieldParser.parseVoiceDefinition(value);
        if (voiceDefinition) {
          if (!props.voices) {
            props.voices = [];
          }
          // 检查是否已存在该声部定义（向上覆盖）
          const existingIndex = props.voices.findIndex(
            (v) => v.voiceNumber === voiceDefinition.voiceNumber,
          );
          if (existingIndex >= 0) {
            props.voices[existingIndex] = voiceDefinition;
          } else {
            props.voices.push(voiceDefinition);
          }
        }
        break;
      }

      case 'O':
        (meta as SNScoreMeta).origin = value;
        break;

      case 'A':
        (meta as SNScoreMeta).area = value;
        break;

      case 'N':
        (meta as SNScoreMeta).notes = value;
        break;

      case 'S':
        (meta as SNScoreMeta).copyright = value;
        break;

      case 'R':
        (meta as SNScoreMeta).rhythm = value;
        break;

      case 'Z':
        (meta as SNScoreMeta).transcription = value;
        break;

      case 'H':
        (meta as SNScoreMeta).history = value;
        break;

      case 'D':
        (meta as SNScoreMeta).discography = value;
        break;

      case 'B':
        (meta as SNScoreMeta).book = value;
        break;

      case 'F':
        (meta as SNScoreMeta).fileUrl = value;
        break;

      case 'G':
        (meta as SNScoreMeta).group = value;
        break;

      case 'P':
        (meta as SNScoreMeta).parts = value;
        break;
    }

    return result;
  }

  /**
   * 应用文件头元数据到 props
   *
   * 检查文件头是否有 %%lyricist 等指令，并添加到 props.contributors
   */
  private applyRootMetaToProps(
    rootMeta: SNRootMeta | undefined,
    props: SNScoreProps,
  ): void {
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
          role: 'lyricist',
        });
      }
    }
  }
}
