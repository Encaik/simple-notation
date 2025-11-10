import type { SNLyricAlignmentType } from '@data/node/lyric';

/**
 * 歌词信息类型
 */
export interface LyricInfo {
  /** 歌词音节 */
  syllable: string;
  /** 对齐类型 */
  alignmentType: SNLyricAlignmentType;
  /** 是否跳过 */
  skip: boolean;
  /** 歌词行号 */
  verse: number;
}

/**
 * 歌词行信息类型
 */
export interface LyricLine {
  /** 歌词行号 */
  verse: number;
  /** 歌词内容 */
  content: string;
  /** 起始小节索引 */
  startMeasureIndex?: number;
}

/**
 * ABC 歌词解析器
 *
 * 职责：解析 ABC 格式中的歌词（w: 和 W: 字段）
 *
 * 支持的特殊符号：
 * - `-`: 音节分割（将一个单词分成多个音节对应多个音符）
 * - `\-`: 多音节单词（多音节单词对齐到单个音符）
 * - `~`: 多词同音符（多个单词对齐到单个音符）
 * - `_`: 延长音（多个音符对齐到单个音节）
 * - `*`: 跳过（跳过音符，不显示歌词）
 *
 * @see https://abcnotation.com/wiki/abc:standard:v2.1#lyrics
 */
export class AbcLyricParser {
  /**
   * 解析歌词行（w: 和 W: 字段）
   *
   * @param lyricLines - 歌词行数组
   * @param musicMeasures - 音乐小节数组（可选，用于验证）
   * @returns 小节索引到歌词信息数组的映射
   *
   * @example
   * ```typescript
   * const lyricLines = [
   *   { verse: 0, content: 'Hel-lo | world', startMeasureIndex: 0 }
   * ];
   * const lyricsMap = parser.parseLyrics(lyricLines);
   * // Map {
   * //   0 => [{ syllable: 'Hel', alignmentType: 'syllable-split', skip: false, verse: 0 },
   * //         { syllable: 'lo', alignmentType: 'syllable-split', skip: false, verse: 0 }],
   * //   1 => [{ syllable: 'world', alignmentType: 'normal', skip: false, verse: 0 }]
   * // }
   * ```
   */
  parseLyrics(
    lyricLines: LyricLine[],
    _musicMeasures?: string[],
  ): Map<number, LyricInfo[]> {
    const lyricsMap = new Map<number, LyricInfo[]>();

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

  /**
   * 解析单个歌词小节
   *
   * @param section - 歌词小节字符串
   * @param verse - 歌词行号
   * @returns 歌词信息数组
   *
   * @example
   * ```typescript
   * // 音节分割
   * parser.parseLyricSection('Hel-lo', 0);
   * // [{ syllable: 'Hel', alignmentType: 'syllable-split', skip: false, verse: 0 },
   * //  { syllable: 'lo', alignmentType: 'syllable-split', skip: false, verse: 0 }]
   *
   * // 多词同音符
   * parser.parseLyricSection('hello~world', 0);
   * // [{ syllable: 'hello world', alignmentType: 'multi-word', skip: false, verse: 0 }]
   *
   * // 跳过
   * parser.parseLyricSection('* hello', 0);
   * // [{ syllable: '', alignmentType: 'skip', skip: true, verse: 0 },
   * //  { syllable: 'hello', alignmentType: 'normal', skip: false, verse: 0 }]
   * ```
   */
  private parseLyricSection(section: string, verse: number): LyricInfo[] {
    const result: LyricInfo[] = [];

    const tokens = section.split(/(\s+)/).filter((t) => t.trim());

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].trim();
      if (!token) continue;

      // 1. 跳过符号 *
      if (token === '*') {
        result.push({
          syllable: '',
          alignmentType: 'skip',
          skip: true,
          verse,
        });
        continue;
      }

      // 2. 延长音符号 _（不生成歌词，继续下一个 token）
      if (token === '_') {
        continue;
      }

      // 3. 多音节单词 \-
      if (token.startsWith('\\-')) {
        const syllable = token.replace(/^\\-/, '').replace(/-/g, '');
        result.push({
          syllable,
          alignmentType: 'multi-syllable',
          skip: false,
          verse,
        });
        continue;
      }

      // 4. 多词同音符 ~
      if (token.includes('~')) {
        const words = token.split('~').filter(Boolean);
        const syllable = words.join(' ');
        result.push({
          syllable,
          alignmentType: 'multi-word',
          skip: false,
          verse,
        });
        continue;
      }

      // 5. 音节分割 -（不是 \- 开头）
      if (token.includes('-') && !token.startsWith('\\-')) {
        const parts = token.split('-').filter(Boolean);
        parts.forEach((part) => {
          result.push({
            syllable: part,
            alignmentType: 'syllable-split',
            skip: false,
            verse,
          });
        });
        continue;
      }

      // 6. 普通歌词
      result.push({
        syllable: token,
        alignmentType: 'normal',
        skip: false,
        verse,
      });
    }

    return result;
  }

  /**
   * 从乐谱内容中提取歌词行
   *
   * @param content - 乐谱内容字符串
   * @returns 歌词行数组
   *
   * @example
   * ```typescript
   * const content = `
   * C D E F | G A B c |
   * w: do re mi fa | sol la ti do |
   * W: hello world |
   * `;
   * const lyricLines = parser.extractLyricLines(content);
   * // [
   * //   { verse: 0, content: 'do re mi fa | sol la ti do |', startMeasureIndex: 0 },
   * //   { verse: 1, content: 'hello world |', startMeasureIndex: 0 }
   * // ]
   * ```
   */
  extractLyricLines(content: string): LyricLine[] {
    const lyricLines: LyricLine[] = [];
    let verseNumber = 0;

    const lines = content.split(/\r?\n/);
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

        // 计算该歌词行之前有多少小节
        let measureCountBefore = 0;
        let musicLineIndex = lineIndex - 1;

        // 向前查找最近的音乐行
        while (
          musicLineIndex >= 0 &&
          (/^\s*[wW]:/i.test(lines[musicLineIndex]) ||
            !lines[musicLineIndex].trim())
        ) {
          musicLineIndex--;
        }

        // 统计之前所有音乐行的小节数
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

    return lyricLines;
  }
}
