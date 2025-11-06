import {
  SNAbcInput,
  SNParserElement,
  SNVoiceMetaClef,
  SNRootMeta,
  SNScoreMeta,
  SNSectionMeta,
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
 * 将 ABC 的 noteLength（如 "1/4", "1/8"）转换为通用的 SNTimeUnit（整数 Ticks 方案）
 *
 * 设计思路：
 * - ABC 的 L: 字段（noteLength）表示默认音符长度，通常也是乐谱中最常见的时值
 * - 基于 noteLength 动态计算 ticksPerWhole，让常见音符的 ticks 值较小且精确
 * - ticksPerWhole = (1 / noteLength) * 12，这样可以支持三连音，且常见音符都是整数 ticks
 *
 * @param noteLength ABC 格式的 noteLength（如 "1/4", "1/8"）
 * @param timeSignature 拍号（用于计算 ticksPerBeat）
 * @returns SNTimeUnit 对象
 *
 * @example
 * 如果 L: 1/4（四分音符是默认长度）
 * ticksPerWhole = (1 / (1/4)) * 12 = 48
 * 四分音符 = 12 ticks，二分音符 = 24 ticks，八分音符 = 6 ticks（精确，无四舍五入）
 *
 * 如果 L: 1/8（八分音符是默认长度）
 * ticksPerWhole = (1 / (1/8)) * 12 = 96
 * 八分音符 = 12 ticks，四分音符 = 24 ticks，十六分音符 = 6 ticks（精确）
 */
function convertAbcNoteLengthToTimeUnit(
  noteLength: string,
  timeSignature?: { numerator: number; denominator: number },
): SNTimeUnit {
  // 解析 "1/4" 格式
  const match = noteLength.match(/^(\d+)\/(\d+)$/);
  if (!match) {
    // 如果格式不正确，使用默认值（假设最短时值是 1/4）
    const ticksPerWhole = 48; // (1 / (1/4)) * 12
    const ticksPerBeat = timeSignature
      ? Math.round(ticksPerWhole / timeSignature.denominator)
      : 12; // 默认 4/4 拍
    return {
      ticksPerWhole,
      ticksPerBeat,
    };
  }

  const [, num, den] = match.map(Number);
  const noteValue = num / den; // 例如：1/4 = 0.25

  // 计算 ticksPerWhole = (1 / noteLength) * 12
  // 这样设计的好处：
  // 1. 可以精确表示常见倍数和分数（×2, ×4, ÷2, ÷4, ÷8 等），无需四舍五入
  // 2. 支持三连音（÷3, ÷6, ÷12）
  // 3. noteLength 本身 = 12 ticks，数值较小且便于计算
  // 4. 十二是 2² × 3，涵盖了常见的 2 的幂次和 3 的因子
  const ticksPerWhole = Math.round((1 / noteValue) * 12);

  // 计算 ticksPerBeat（根据拍号的 denominator）
  const ticksPerBeat = timeSignature
    ? Math.round(ticksPerWhole / timeSignature.denominator) // 例如：4/4 拍 -> ticksPerBeat = 12
    : Math.round(ticksPerWhole / 4); // 默认 4/4 拍

  return {
    ticksPerWhole,
    ticksPerBeat,
  };
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
   * 解析 Root（文件级别）- 根据 ABC 标准 v2.1
   * @see https://abcnotation.com/wiki/abc:standard:v2.1
   *
   * 处理内容：
   * 1. 文件头（File Header）- 在第一个 X: 之前的内容
   * 2. 多个 tune 的分离（每个以 X: 开头）
   * 3. 文件级别的元数据和指令（%% 开头）
   */
  parseRoot(data: string): SNParserRoot {
    // 1. 分离文件头和 tune 内容
    const { fileHeader, tunesData } = this.splitFileHeaderAndTunes(data);

    // 2. 解析文件头元数据（%% 指令等）
    const parsedFileHeader = this.parseFileHeader(fileHeader);

    // 3. 匹配所有 tune（每个以 X: 开头）
    const scoreRegex = /X:.*?(?=X:|$)/gs;
    const scores = (tunesData.match(scoreRegex) || [])
      .map((score) => score.trim())
      .filter((score) => score.length > 0);

    // 4. 兼容处理：如果没有匹配到，使用默认逻辑兜底
    if (scores.length === 0 && tunesData.trim().length > 0) {
      scores.push(tunesData.trim()); // 整体作为一个乐谱
    }

    // 5. 创建 root 节点
    const root = new SNParserRoot({
      id: this.getNextId('root'),
      originStr: data,
    });

    // 6. 将文件头信息设置到 root.meta 中
    if (parsedFileHeader) {
      parsedFileHeader.tuneCount = scores.length;
      root.setMeta(parsedFileHeader);
    } else if (scores.length > 0) {
      // 如果没有文件头，但有多首曲子，至少设置 tuneCount
      root.setMeta({ tuneCount: scores.length });
    }

    // 7. 添加所有 tune 作为子节点
    return root.addChildren(
      scores.map((scoreData): SNParserScore => this.parseScore(scoreData)),
    );
  }

  /**
   * 分离文件头和 tune 内容
   * 文件头是在第一个 X: 之前的所有内容
   */
  private splitFileHeaderAndTunes(data: string): {
    fileHeader: string;
    tunesData: string;
  } {
    // 查找第一个 X: 的位置
    const firstTuneMatch = data.match(/^X:\s*\d+/m);

    if (!firstTuneMatch || firstTuneMatch.index === undefined) {
      // 没有找到 X:，整个内容都视为 tune（向后兼容）
      return {
        fileHeader: '',
        tunesData: data,
      };
    }

    // 分离文件头和 tune 内容
    const fileHeader = data.slice(0, firstTuneMatch.index).trim();
    const tunesData = data.slice(firstTuneMatch.index).trim();

    return { fileHeader, tunesData };
  }

  /**
   * 解析文件头元数据
   * 处理 %% 开头的指令和注释
   *
   * 支持的格式：
   * - %%abc-2.1 → version: "2.1"
   * - %%abc 2.1 → version: "2.1"
   * - %%encoding utf-8 → encoding: "utf-8"
   * - %%其他指令 → directives["其他指令"]
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

      // 处理 %% 指令（如 %%abc-2.1, %%abc 2.1, %%encoding utf-8）
      // 正则支持：字母、数字、下划线、连字符、点号（用于版本号如 2.1）
      const directiveMatch = line.match(/^%%([a-zA-Z0-9_.-]+)(?:\s+(.+))?$/);
      if (directiveMatch) {
        const [, key, value] = directiveMatch;

        // 处理 ABC 版本信息
        // %%abc-2.1 或 %%abc 2.1 格式才是版本号
        // %%abc-charset 等不是版本号，应该作为普通指令处理
        if (key === 'abc') {
          // %%abc 2.1 格式：key = "abc", value = "2.1"
          if (value) {
            rootMeta.version = value;
          } else {
            // %%abc 格式（无版本号）
            rootMeta.version = '';
          }
        } else if (key.startsWith('abc-')) {
          // %%abc-2.1 格式：key = "abc-2.1"，但需要验证是否为版本号
          // 版本号格式应该是数字开头（如 "2.1", "1.2.3"）
          // 排除 abc-charset、abc-charset-utf-8 等非版本指令
          const afterAbc = key.slice(4); // 去掉 "abc-" 前缀

          // 判断是否为版本号格式：以数字开头，包含数字和点号
          if (/^\d[0-9.]*$/.test(afterAbc)) {
            // 是版本号：%%abc-2.1 → version = "2.1"
            rootMeta.version = afterAbc;
          } else {
            // 不是版本号：%%abc-charset → directives["abc-charset"] = value
            rootMeta.directives![key] = value || '';
          }
        } else if (key === 'encoding') {
          // 编码信息：%%encoding utf-8
          rootMeta.encoding = value || '';
        } else {
          // 其他指令：%%其他指令 值
          rootMeta.directives![key] = value || '';
        }
        continue;
      }

      // 处理单行注释（% 开头，但不是 %% 指令）
      if (line.startsWith('%') && !line.startsWith('%%')) {
        rootMeta.comments!.push(line.slice(1).trim());
        continue;
      }

      // 其他内容作为注释或说明（排除 ABC 字段行）
      if (line.length > 0 && !line.match(/^[A-Z]:/)) {
        rootMeta.comments!.push(line);
      }
    }

    // 如果没有解析到任何内容，返回 undefined
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

  parseScore(scoreData: string): SNParserScore {
    // 解析乐谱头部和主体
    const { head, body } = this.splitScoreHeadAndBody(scoreData);
    const { id, meta, props } = this.parseScoreHeader(head);
    const sections = this.parseScoreBody(body);

    return new SNParserScore({
      id: id || this.getNextId('score'),
      originStr: scoreData,
    })
      .setMeta(meta)
      .setProps(props)
      .addChildren(
        sections.map((sectionData) => this.parseSection(sectionData)),
      );
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

  /**
   * 解析 Score 头部（根据 ABC 标准 v2.1）
   *
   * 区分两类数据：
   * 1. 通用布局渲染信息（所有记谱法都有的）→ 返回为 props
   *    - timeSignature, keySignature, tempo
   *    - title, subtitle, contributors
   *
   * 2. ABC 特有的元数据（不参与布局渲染）→ 返回为 meta
   *    - origin, area, notes, copyright, noteLength 等
   */
  private parseScoreHeader(header: string): {
    id: string | null;
    meta: SNScoreMeta;
    props: SNScoreProps;
  } {
    // 初始化 ABC 特有的元数据
    const meta: SNScoreMeta = {};

    // 初始化通用布局信息（存放在 props 中）
    const props: SNScoreProps = {
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: { symbol: 'natural', letter: 'C' },
      tempo: { value: 120, unit: 'BPM' },
      // 默认 timeUnit（如果没有 L: 字段，使用默认值）
      timeUnit: { ticksPerWhole: 48, ticksPerBeat: 12 }, // 默认 noteLength = 1/4，4/4 拍
    };

    let id: string | null = null;

    // 按行分割头部（处理可能的\r\n换行）
    const lines = header
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    // 头部字段正则匹配规则（键值对）
    // 扩展支持的字段：X, T, C, O, A, N, S, M, L, Q, K, H, G, R, Z, D, F, B
    const fieldRegex = /^([XTCSMLQKHOAGNRZDFB]):\s*(.*)$/;

    for (const line of lines) {
      const match = line.match(fieldRegex);
      if (!match) continue; // 跳过不符合格式的行

      const [, key, value] = match; // 解构键和值

      switch (key) {
        case 'X':
          // 参考编号
          id = value || null;
          break;

        case 'T':
          // 标题（T: 字段）- 存储在 props 中（通用布局信息）
          if (!props.title) {
            props.title = value;
          } else {
            props.subtitle = value; // 第二个 T: 作为副标题
          }
          break;

        case 'C':
          // 创作者（C: 字段）- 存储在 props 中（通用布局信息）
          if (!props.contributors) {
            props.contributors = [];
          }
          props.contributors.push({ name: value, role: 'composer' as const });
          break;

        case 'O':
          // 来源/国家（O: 字段）- ABC 特有
          meta.origin = value;
          break;

        case 'A':
          // 地区（A: 字段）- ABC 特有
          meta.area = value;
          break;

        case 'N':
          // 注释（N: 字段）- ABC 特有
          meta.notes = value;
          break;

        case 'M': {
          // 拍号（M: 字段）- 通用布局信息
          const timeMatch = value.match(/^(\d+)\/(\d+)$/);
          if (timeMatch) {
            const [, num, den] = timeMatch.map(Number);
            if (num > 0 && den > 0) {
              props.timeSignature = { numerator: num, denominator: den };
              // 更新 timeUnit 的 ticksPerBeat
              if (props.timeUnit) {
                // 如果已有 ticksPerWhole，更新 ticksPerBeat
                props.timeUnit.ticksPerBeat = Math.round(
                  props.timeUnit.ticksPerWhole / den,
                );
              } else {
                // 如果没有 timeUnit，创建默认值
                const defaultTicksPerWhole = 48; // 假设 noteLength = 1/4
                props.timeUnit = {
                  ticksPerWhole: defaultTicksPerWhole,
                  ticksPerBeat: Math.round(defaultTicksPerWhole / den),
                };
              }
            }
          }
          break;
        }

        case 'K': {
          // 调号（K: 字段）- 通用布局信息
          // 支持格式：C, Cm, C#, C#m, Cb, Cbm, C major, C minor 等
          const keyMatch = value.match(
            /^([A-Ga-g])([#b])?(?:\s+(m|major|minor))?$/,
          );
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
            // 注意：mode (major/minor) 如果需要，可以存储到 meta 中
          } else {
            // 支持直接写 "C major" 格式
            const majorMatch = value.match(/^([A-Ga-g])\s+major$/i);
            const minorMatch = value.match(/^([A-Ga-g])\s+minor$/i);
            if (majorMatch || minorMatch) {
              const match = majorMatch || minorMatch;
              if (match && match[1]) {
                const letter = match[1].toUpperCase();
                props.keySignature = {
                  letter,
                  symbol: 'natural',
                };
              }
            }
          }
          break;
        }

        case 'Q': {
          // 速度（Q: 字段）- 通用布局信息
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
          // 默认音符长度（L: 字段）- 转换为通用 timeUnit 并存储
          if (/^\d+\/\d+$/.test(value)) {
            // ABC 特有格式：存储在 meta 以便追溯来源
            meta.noteLength = value;

            // 转换为通用 timeUnit：用于布局计算和时间对齐
            props.timeUnit = convertAbcNoteLengthToTimeUnit(
              value,
              props.timeSignature,
            );
          }
          break;

        case 'S':
          // 头部的S:字段视为来源信息（存入meta的copyright）- ABC 特有
          meta.copyright = value;
          break;

        case 'H':
        case 'G':
        case 'R':
        case 'Z':
        case 'D':
        case 'F':
        case 'B':
          // 其他 ABC 字段，存储到 meta 中
          if (!meta[key.toLowerCase() as keyof SNScoreMeta]) {
            (meta as Record<string, unknown>)[key.toLowerCase()] = value;
          }
          break;
      }
    }

    return {
      id,
      meta,
      props,
    };
  }

  private parseScoreBody(body: string): string[] {
    // 1. 匹配所有以S:开头的章节（包含S:本身）
    // 正则：全局匹配以S:开头，直到下一个S:或结束的内容
    const sectionRegex = /S:.*?(?=S:|$)/gs;
    return body.match(sectionRegex) || [body];
  }

  parseSection(sectionData: string): SNParserSection {
    // 命名捕获组：提取S:冒号后的内容（sMetaValue）和剩余内容（rest）
    const sectionMatch = sectionData.match(
      /^\s*S:\s*(?<sMetaValue>.*?)(?:\r?\n|$)(?<rest>.*)$/s,
    );

    // 解构获取值（处理无S:的情况）
    const { sMetaValue = '', rest = sectionData.trim() } =
      sectionMatch?.groups || {};

    // 解析 section 的头部字段（T:, M:, K:, Q:, L:, C: 等）
    // 将这些字段从 rest 中分离出来
    const { headerFields, content } = this.splitSectionHeaderAndContent(rest);

    // 解析 section 的 props 和 meta（支持冗余存储）
    const { props, meta } = this.parseSectionHeader(headerFields, sMetaValue);

    // 用剩余内容拆分声部
    const voiceMatch = content.trim().match(/(?<voice>V:.*?(?=\s*V:|$))/gs);
    const voices = voiceMatch?.map((v) => v.trim()) || [];

    // 处理无V:的情况
    if (voices.length === 0 && content.trim()) {
      voices.push(content.trim());
    }

    return new SNParserSection({
      id: sMetaValue || this.getNextId('section'),
      originStr: sectionData,
    })
      .setMeta(meta)
      .setProps(props)
      .addChildren(voices.map((voiceData) => this.parseVoice(voiceData)));
  }

  /**
   * 分离 section 的头部字段和内容
   * 头部字段包括：T:, M:, K:, Q:, L:, C: 等
   */
  private splitSectionHeaderAndContent(sectionContent: string): {
    headerFields: string;
    content: string;
  } {
    const lines = sectionContent.split(/\r?\n/).map((line) => line.trim());
    const headerLines: string[] = [];
    const contentLines: string[] = [];
    let isHeader = true;

    // 匹配字段行（T:, M:, K:, Q:, L:, C: 等）
    const fieldRegex = /^([TMKLQC]):/;

    for (const line of lines) {
      if (isHeader && line && fieldRegex.test(line)) {
        // 字段行，归为头部
        headerLines.push(line);
      } else {
        // 非字段行，切换到内容模式
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
   * 解析 Section 头部字段（根据 ABC 标准 v2.1）
   *
   * 区分两类数据：
   * 1. 通用布局渲染信息（所有记谱法都有的）→ 返回为 props
   *    - timeSignature, keySignature, tempo
   *    - title, subtitle, contributors
   *
   * 2. ABC 特有的元数据（不参与布局渲染）→ 返回为 meta
   *    - noteLength, sectionId 等
   */
  private parseSectionHeader(
    header: string,
    sectionId: string,
  ): {
    meta: SNSectionMeta;
    props: SNScoreProps;
  } {
    // 初始化 ABC 特有的元数据
    const meta: SNSectionMeta = {
      sectionId: sectionId || undefined,
    };

    // 初始化通用布局信息（存放在 props 中）
    const props: SNScoreProps = {
      // 默认 timeUnit（如果没有 L: 字段，使用默认值）
      timeUnit: { ticksPerWhole: 48, ticksPerBeat: 12 }, // 默认 noteLength = 1/4，4/4 拍
    };

    if (!header.trim()) {
      return { meta, props };
    }

    // 按行分割头部（处理可能的\r\n换行）
    const lines = header
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    // 头部字段正则匹配规则（键值对）
    const fieldRegex = /^([TMKLQC]):\s*(.*)$/;

    for (const line of lines) {
      const match = line.match(fieldRegex);
      if (!match) continue; // 跳过不符合格式的行

      const [, key, value] = match; // 解构键和值

      switch (key) {
        case 'T':
          // 标题（T: 字段）- 存储在 props 中（通用布局信息）
          if (!props.title) {
            props.title = value;
          } else {
            props.subtitle = value; // 第二个 T: 作为副标题
          }
          break;

        case 'C':
          // 创作者（C: 字段）- 存储在 props 中（通用布局信息）
          if (!props.contributors) {
            props.contributors = [];
          }
          props.contributors.push({ name: value, role: 'composer' as const });
          break;

        case 'M': {
          // 拍号（M: 字段）- 通用布局信息
          const timeMatch = value.match(/^(\d+)\/(\d+)$/);
          if (timeMatch) {
            const [, num, den] = timeMatch.map(Number);
            if (num > 0 && den > 0) {
              props.timeSignature = { numerator: num, denominator: den };
              // 更新 timeUnit 的 ticksPerBeat
              if (props.timeUnit) {
                // 如果已有 ticksPerWhole，更新 ticksPerBeat
                props.timeUnit.ticksPerBeat = Math.round(
                  props.timeUnit.ticksPerWhole / den,
                );
              } else {
                // 如果没有 timeUnit，创建默认值
                const defaultTicksPerWhole = 48; // 假设 noteLength = 1/4
                props.timeUnit = {
                  ticksPerWhole: defaultTicksPerWhole,
                  ticksPerBeat: Math.round(defaultTicksPerWhole / den),
                };
              }
            }
          }
          break;
        }

        case 'K': {
          // 调号（K: 字段）- 通用布局信息
          const keyMatch = value.match(
            /^([A-Ga-g])([#b])?(?:\s+(m|major|minor))?$/,
          );
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
          } else {
            // 支持直接写 "C major" 格式
            const majorMatch = value.match(/^([A-Ga-g])\s+major$/i);
            const minorMatch = value.match(/^([A-Ga-g])\s+minor$/i);
            if (majorMatch || minorMatch) {
              const match = majorMatch || minorMatch;
              if (match && match[1]) {
                const letter = match[1].toUpperCase();
                props.keySignature = {
                  letter,
                  symbol: 'natural',
                };
              }
            }
          }
          break;
        }

        case 'Q': {
          // 速度（Q: 字段）- 通用布局信息
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
          // 默认音符长度（L: 字段）- 转换为通用 timeUnit 并存储
          if (/^\d+\/\d+$/.test(value)) {
            // ABC 特有格式：存储在 meta 以便追溯来源
            meta.noteLength = value;

            // 转换为通用 timeUnit：用于布局计算和时间对齐
            props.timeUnit = convertAbcNoteLengthToTimeUnit(
              value,
              props.timeSignature,
            );
          }
          break;
      }
    }

    return { meta, props };
  }

  parseVoice(voiceData: string): SNParserVoice {
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

    // 4. 生成唯一ID（基于声部编号和名称）
    const id = `voice-${voiceNumber}-${name.toLowerCase().replace(/\W+/g, '-')}`;
    const voice = new SNParserVoice({
      id: id || this.getNextId('voice'),
      originStr: voiceData,
    });

    // 3. 分离音符行和歌词行（w: 和 W: 字段）- 根据 ABC 标准 v2.1
    // w: 第一行歌词，W: 后续行歌词（多节）
    const lyricLines: Array<{ verse: number; content: string }> = [];
    let verseNumber = 0;

    // 匹配所有 w: 和 W: 行
    const lyricRegex = /^\s*([wW]):\s*(.+)$/gim;
    let match;
    while ((match = lyricRegex.exec(measuresContent)) !== null) {
      const isUpperCase = match[1] === 'W';
      // w: 为第 0 行，W: 为第 1, 2, 3... 行
      if (!isUpperCase) {
        verseNumber = 0;
      } else {
        verseNumber++;
      }
      lyricLines.push({
        verse: verseNumber,
        content: match[2].trim(),
      });
    }

    // 移除所有 w: 和 W: 行，得到纯音乐内容
    const musicContent = measuresContent
      .replace(/^\s*[wW]:\s*.*$/gim, '')
      .trim();

    // 4. 初步拆分小节（按 | 分割，保留原始内容）
    const rawMeasures = musicContent
      .split('|')
      .map((measure) => measure.trim())
      .filter(Boolean);

    // 5. 初始化两个数组
    const metadataMeasures: string[] = [];
    const musicMeasures: string[] = [];

    // 6. 遍历拆分（元数据识别正则）
    const metaPattern = /^\[([KMTL]:|key|meter|title|tempo).*]$/i; // 扩展常见元数据
    rawMeasures.forEach((measure) => {
      if (metaPattern.test(measure)) {
        metadataMeasures.push(measure);
      } else {
        musicMeasures.push(measure);
      }
    });

    // 7. 解析歌词，建立歌词到音符的映射关系（支持多行歌词）
    const lyricsMap = this.parseLyrics(lyricLines, musicMeasures);

    // 获取父级的 timeUnit（从 section 或 score 继承）
    const parentTimeUnit = this.getParentTimeUnit(voice);

    return voice
      .setMeta({
        clef,
        transpose: undefined, // 可扩展：从metaLine匹配 transpose=±数字
        keySignature: this.parseKeySignature(metadataMeasures.join()), // 提取声部专属调号
      })
      .addChildren(
        musicMeasures.map((measureData, i) => {
          const measureIndex = i;
          const lyricsForMeasure = lyricsMap?.get(measureIndex) || [];
          return this.parseMeasure(
            measureData,
            i + 1,
            lyricsForMeasure,
            parentTimeUnit,
          );
        }),
      );
  }

  /**
   * 从父节点获取 timeUnit（向上查找 section -> score）
   */
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

  /**
   * 获取默认的 noteLength 值（相对于全音符的比例）
   *
   * 从父节点向上查找 L: 字段的值（从 meta.noteLength），如果没有则使用默认值 1/4
   *
   * @param elementData 元素数据（用于上下文，当前未使用）
   * @param node 当前节点（可选，用于向上查找）
   * @returns noteLength 值（相对于全音符的比例），例如 1/4 = 0.25
   */
  private getDefaultNoteLength(
    _elementData: string,
    node?: SNParserNode,
  ): number {
    // 从父节点向上查找 L: 字段的值
    if (node) {
      let current: SNParserNode | undefined = node.parent;
      while (current) {
        // 检查 meta 中是否有 noteLength
        const meta = current.meta as { noteLength?: string } | undefined;
        if (meta?.noteLength) {
          // 解析 "1/4" 格式
          const match = meta.noteLength.match(/^(\d+)\/(\d+)$/);
          if (match) {
            const [, num, den] = match.map(Number);
            return num / den; // 例如：1/4 = 0.25
          }
        }
        current = current.parent;
      }
    }

    // 如果找不到，使用默认值 1/4
    return 1 / 4; // 默认 L: 1/4
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
  ): SNParserMeasure {
    const barline = this.parseBarline(measureData);
    const elementsData = measureData.replace(':', '');

    const measure = new SNParserMeasure({
      id: this.getNextId('measure'),
      index,
      originStr: measureData,
    });

    // 获取 timeUnit（从参数传入，或从父节点继承）
    const timeUnit = parentTimeUnit || getTimeUnitFromNode(measure);

    // 解析元素，并转换为正确的 duration
    const elements = this.parseElements(
      elementsData,
      lyricsForMeasure,
      timeUnit,
    );

    // 计算每个元素的时序位置（startPosition）并设置
    let currentPosition = 0;
    const elementsWithPosition = elements.map((element) => {
      if (element.duration !== undefined) {
        // 设置起始位置（可以通过 meta 存储，这里先扩展节点）
        const startPosition = calculateStartPosition(currentPosition);
        const endPosition = calculateEndPosition(
          startPosition,
          element.duration,
        );

        // 存储时序信息（扩展 meta，后续可以定义 SNMeasureElementMeta）
        // 这里暂时通过扩展 element 来存储，实际可以通过 meta 接口定义
        (element as any).startPosition = startPosition;
        (element as any).endPosition = endPosition;

        currentPosition = endPosition;
      }
      return element;
    });

    // 验证小节的时值是否正确
    // 获取 timeSignature（从父节点继承或使用默认值）
    const timeSignature = this.getParentTimeSignature(measure) || {
      numerator: 4,
      denominator: 4,
    };

    // 只有在有 timeUnit 的情况下才进行验证
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

    return measure
      .setMeta({
        barline,
      })
      .addChildren(elementsWithPosition);
  }

  /**
   * 从父节点获取 timeSignature（向上查找）
   */
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
    let elementIndex = 0; // 当前小节内的元素索引（用于歌词匹配，包括音符、休止符等）

    for (const token of tokens) {
      try {
        const element = this.parseElement(token, timeUnit);
        if (element) {
          elements.push(element);

          // 统一处理歌词关联：所有支持歌词的元素（note、rest、tuplet 等）
          if (lyricsForMeasure && this.isElementSupportLyric(element.type)) {
            const lyricInfo = lyricsForMeasure[elementIndex];

            // 处理歌词（考虑跳过符号和不同对齐类型）
            if (lyricInfo) {
              if (!lyricInfo.skip) {
                // 创建歌词节点，挂载到元素的 children 下
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
              // 跳过符号（*）也要计入索引，但不创建歌词节点
              elementIndex++;
            } else {
              // 没有歌词信息，正常计数
              elementIndex++;
            }

            // 更新索引：对于连音，需要计算内部音符数量
            if (element.type === 'tuplet') {
              const tuplet = element as SNParserTuplet;
              const tupletNotes = (tuplet.children || []).filter((c) =>
                this.isElementSupportLyric(c.type),
              );
              // 连音内部的每个音符都需要对应一个歌词索引
              // 但当前实现中，连音本身不计入索引，只计算内部音符
              // 所以这里需要特殊处理：跳过连音本身的索引，让内部音符处理
              elementIndex--; // 回退，因为连音内部会单独处理
              // 为连音内的每个音符分配歌词
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
            // 没有歌词时，连音也要更新索引
            const tuplet = element as SNParserTuplet;
            const tupletNotes = (tuplet.children || []).filter((c) =>
              this.isElementSupportLyric(c.type),
            );
            elementIndex += tupletNotes.length;
          } else if (this.isElementSupportLyric(element.type)) {
            // 其他支持歌词的元素（即使没有歌词也要计入索引）
            elementIndex++;
          }
        }
      } catch {
        console.warn(`Skipping unsupported element: ${token}`);
      }
    }

    return elements;
  }

  /**
   * 判断元素类型是否支持关联歌词
   * 目前支持：音符、休止符、连音、延音线、和弦
   */
  private isElementSupportLyric(
    type: string,
  ): type is 'note' | 'rest' | 'tuplet' | 'tie' | 'chord' {
    return ['note', 'rest', 'tuplet', 'tie', 'chord'].includes(type);
  }

  /**
   * 解析元素（音符、休止符等）
   *
   * @param elementData 元素数据字符串
   * @param timeUnit 时间单位配置（可选，用于转换 duration）
   * @returns 解析后的元素节点
   */
  parseElement(elementData: string, timeUnit?: SNTimeUnit): SNParserElement {
    const trimmed = elementData.trim();

    if (!trimmed) throw new Error('Empty element');

    // 处理延音线
    if (trimmed === '-') {
      return new SNParserTie({
        id: this.getNextId('tie'),
        style: 'slur', // 可扩展为不同类型的连音线
        originStr: elementData,
      });
    }

    // 1. 优先处理所有连音（(3BBB、(5ABCDF 等）
    const tupletMatch = trimmed.match(/^\((\d+)([\s\S]*?)\)?$/);
    if (tupletMatch) {
      const [, , innerNotesStr] = tupletMatch;

      // 关键：拆分连音内部的音符（如 "BBB" → ["B", "B", "B"]）
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

    // 2. 解析休止符（如 z4、z8.）
    if (trimmed.startsWith('z')) {
      let duration: number;

      if (timeUnit) {
        // 休止符的解析逻辑与音符相同
        const defaultNoteLength = this.getDefaultNoteLength(trimmed);
        const restStr = trimmed.slice(1); // 去掉 'z'
        const durationStr = restStr.match(/^(\d+)/)?.[1];
        const dotCount = (restStr.match(/\./g) || []).length;

        // ABC 数字表示全音符的分母，例如 "z2" = 1/2（二分休止符），"z4" = 1/4（四分休止符）
        // 如果没有数字，则使用默认 L: 值
        const noteValue = durationStr
          ? 1 / parseInt(durationStr, 10) // 例如 "2" -> 1/2 = 0.5（二分休止符）
          : defaultNoteLength; // 例如 L:1/4 -> 0.25（四分休止符）
        const dottedNoteValue =
          dotCount > 0
            ? noteValue * (1 + 0.5 * (1 - Math.pow(0.5, dotCount)))
            : noteValue;

        // 转换为 duration（ticks，整数）
        duration = noteValueToDuration(dottedNoteValue, timeUnit);
      } else {
        // 向后兼容
        duration = parseInt(trimmed.slice(1), 10) || 1;
      }

      return new SNParserRest({
        id: this.getNextId('rest'),
        duration,
        originStr: elementData,
      });
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

      // 3. 解析时值并转换为 duration（ticks）
      // ABC 中数字表示全音符的分母，如果没有数字则使用默认 L: 值
      // 例如：如果 L: 是 1/4，"C4" = 1/4（四分音符），"C2" = 1/2（二分音符），"C" = 1/4（默认）
      let duration: number;

      if (timeUnit) {
        // 获取 L: 字段的值（从父节点继承，或使用默认值 1/4）
        // 注意：这里暂时无法获取 node，需要在解析上下文中传递
        // TODO: 改进解析流程，传递当前解析的节点上下文
        const defaultNoteLength = this.getDefaultNoteLength(trimmed);
        const noteLengthValue = defaultNoteLength; // 相对于全音符，例如 1/4 = 0.25

        // ABC 数字表示全音符的分母，例如 "G2" = 1/2（二分音符），"G4" = 1/4（四分音符）
        // 如果没有数字，则使用默认 L: 值
        const noteValue = durationStr
          ? 1 / parseInt(durationStr, 10) // 例如 "2" -> 1/2 = 0.5（二分音符）
          : noteLengthValue; // 例如 L:1/4 -> 0.25（四分音符）

        // 处理附点（每个点表示延长 1/2）
        const dotCount = (trimmed.match(/\./g) || []).length;
        const dottedNoteValue =
          dotCount > 0
            ? noteValue * (1 + 0.5 * (1 - Math.pow(0.5, dotCount)))
            : noteValue;

        // 转换为 duration（ticks，整数）
        duration = noteValueToDuration(dottedNoteValue, timeUnit);
      } else {
        // 如果没有 timeUnit，使用原始值（向后兼容）
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
   * 解析歌词行（w: 和 W: 字段）- 根据 ABC 标准 v2.1
   * @see https://abcnotation.com/wiki/abc:standard:v2.1#lyrics
   *
   * 支持的符号：
   * - `-` : 音节分割（一个单词分成多个音节对应多个音符）
   * - `\-` : 多音节单词对齐到单个音符
   * - `~` : 多个单词对齐到单个音符
   * - `_` : 多个音符对齐到单个音节（延长音）
   * - `*` : 跳过音符，不显示歌词
   * - `|` : 小节线对齐
   *
   * @param lyricLines 歌词行数组（包含 verse 和 content）
   * @param _musicMeasures 音乐小节数组（用于参考）
   * @returns Map<小节索引, 歌词音节信息数组>
   */
  private parseLyrics(
    lyricLines: Array<{ verse: number; content: string }>,
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

    // 处理每一行歌词（支持多行）
    lyricLines.forEach(({ verse, content }) => {
      // 按小节线（|）分割歌词
      const lyricSections = content.split('|').map((s) => s.trim());

      lyricSections.forEach((section, measureIndex) => {
        if (!section) return;

        // 解析歌词片段，处理所有 ABC 标准符号
        const syllables = this.parseLyricSection(section, verse);

        if (syllables.length > 0) {
          // 合并到小节（支持多行歌词叠加）
          const existing = lyricsMap.get(measureIndex) || [];
          lyricsMap.set(measureIndex, [...existing, ...syllables]);
        }
      });
    });

    return lyricsMap;
  }

  /**
   * 解析单个小节的歌词片段
   * 处理 ABC 标准的各种对齐符号
   */
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

    // 按空格分割，但要保留特殊符号
    const tokens = section.split(/(\s+)/).filter((t) => t.trim());

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].trim();
      if (!token) continue;

      if (token === '*') {
        // 跳过符号：添加一个 skip 标记
        result.push({
          syllable: '',
          alignmentType: 'skip',
          skip: true,
          verse,
        });
      } else if (token === '_') {
        // 延长音符号：多个音符对齐到单个音节（在当前实现中，延长音通常不显示歌词）
        // 这里可以选择跳过或添加空音节
        continue;
      } else if (token.startsWith('\\-')) {
        // 多音节单词（\-）：多音节单词对齐到单个音符
        const syllable = token.replace(/^\\-/, '').replace(/-/g, '');
        result.push({
          syllable,
          alignmentType: 'multi-syllable',
          skip: false,
          verse,
        });
      } else if (token.includes('~')) {
        // 多词同音符（~）：多个单词对齐到单个音符
        const words = token.split('~').filter(Boolean);
        const syllable = words.join(' ');
        result.push({
          syllable,
          alignmentType: 'multi-word',
          skip: false,
          verse,
        });
      } else if (token.includes('-') && !token.startsWith('\\-')) {
        // 音节分割（-）：一个单词分成多个音节对应多个音符
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
        // 正常对齐
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
