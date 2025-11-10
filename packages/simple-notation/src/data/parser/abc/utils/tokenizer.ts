/**
 * ABC 分词器
 *
 * 职责：将小节内的音符串分词为独立的 token
 * - 识别连音（tuplet）
 * - 识别普通音符
 * - 识别休止符
 * - 识别连音线
 * - 识别其他符号
 */
export class AbcTokenizer {
  /**
   * 将小节数据分词为 token 数组
   *
   * 支持识别：
   * - 连音：(3ABC) 或 (3A B C)
   * - 音符：A, C#, Eb, A'', C,,
   * - 休止符：z, z2, z4
   * - 连音线：-
   * - 其他符号：[K:C], [V:1] 等
   *
   * @param measureData - 小节数据字符串
   * @returns token 数组
   *
   * @example
   * ```typescript
   * AbcTokenizer.tokenize('A B C D');
   * // ['A', 'B', 'C', 'D']
   *
   * AbcTokenizer.tokenize('(3ABC DEF');
   * // ['(3A B C)', 'D', 'E', 'F']
   *
   * AbcTokenizer.tokenize('[K:C] A B - C');
   * // ['[K:C]', 'A', 'B', '-', 'C']
   * ```
   */
  static tokenize(measureData: string): string[] {
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

      // 0. 优先捕获行内标记（[K:...], [V:...], [M:...], [Q:...], [I:...] 等）
      if (measureData[pos] === '[') {
        const inlineToken = this.extractInlineField(measureData, pos);
        if (inlineToken) {
          tokens.push(inlineToken.token);
          pos = inlineToken.endPos;
          continue;
        }
        // 如果不是有效的行内标记，将 [ 作为普通字符处理
        // 跳过这个字符，避免死循环
        pos++;
        continue;
      }

      // 1. 优先捕获连音（ABC语法：(n+音符，n为数字）
      if (
        measureData[pos] === '(' &&
        pos + 1 < len &&
        /\d/.test(measureData[pos + 1])
      ) {
        const tupletToken = this.extractTuplet(measureData, pos);
        if (tupletToken) {
          tokens.push(tupletToken.token);
          pos = tupletToken.endPos;
          continue;
        }
        // 如果不是有效的连音，将 ( 作为普通字符处理
        // 跳过这个字符，避免死循环
        pos++;
        continue;
      }

      // 2. 捕获普通音符/休止符（A-G/z开头，含变音、八度等）
      if (noteRegex.test(measureData[pos])) {
        const note = this.extractNote(measureData, pos);
        tokens.push(note.token);
        pos = note.endPos;
        continue;
      }

      // 3. 捕获其他符号（小节线等）
      let tokenEnd = pos;
      while (tokenEnd < len && !/\s|[A-Ga-gz([]/.test(measureData[tokenEnd])) {
        tokenEnd++;
      }

      // 如果没有前进，说明遇到了无法识别的字符，跳过它
      if (tokenEnd === pos) {
        pos++;
        continue;
      }

      const token = measureData.slice(pos, tokenEnd).trim();
      // 过滤掉无效的 token：
      // - 单个字母（A-Z、a-z，但不是有效音符）
      // - 单个符号（如 ]、K 等）
      // 只保留可能是小节线或其他有意义的符号
      if (token && !this.isInvalidToken(token)) {
        tokens.push(token);
      }
      pos = tokenEnd;
    }

    return tokens;
  }

  /**
   * 判断 token 是否无效
   *
   * 无效的 token 包括：
   * - 单个大写字母（K、M、Q 等，可能是未闭合的行内标记）
   * - 单个符号（]、: 等）
   * - 空字符串
   *
   * @param token - token 字符串
   * @returns 是否为无效 token
   */
  private static isInvalidToken(token: string): boolean {
    if (!token) return true;

    // 单个大写字母（可能是未闭合的行内标记，如 K、V、M、Q 等）
    if (/^[A-Z]$/.test(token)) return true;

    // 单个符号：]、:、| 等
    if (/^[\]:|)]$/.test(token)) return true;

    return false;
  }

  /**
   * 提取行内标记 token
   *
   * 支持的行内标记：
   * - [K:...] - 行内调号
   * - [V:...] - 行内声部
   * - [M:...] - 行内拍号
   * - [Q:...] - 行内速度
   * - [I:...] - 行内指令
   * - [r:...] - 行内注释
   * - [P:...] - 行内部分标记
   *
   * @param measureData - 小节数据
   * @param startPos - 起始位置（指向左方括号）
   * @returns 行内标记 token 和结束位置，失败返回 undefined
   */
  private static extractInlineField(
    measureData: string,
    startPos: number,
  ): { token: string; endPos: number } | undefined {
    const len = measureData.length;
    let i = startPos + 1; // 跳过 [

    // 查找右方括号 ]
    while (i < len && measureData[i] !== ']') {
      i++;
    }

    // 如果没有找到右方括号，返回 undefined
    if (i >= len) {
      return undefined;
    }

    // 包含右方括号
    i++;

    const token = measureData.slice(startPos, i);

    // 验证是否为有效的行内标记
    // 支持 [K:...], [V:...], [M:...], [Q:...], [I:...], [r:...], [P:...] 等
    if (/^\[[A-Za-z]:/.test(token)) {
      return { token, endPos: i };
    }

    // 如果不是有效的行内标记，返回 undefined
    return undefined;
  }

  /**
   * 提取连音 token
   *
   * @param measureData - 小节数据
   * @param startPos - 起始位置（指向左括号）
   * @returns 连音 token 和结束位置，失败返回 undefined
   */
  private static extractTuplet(
    measureData: string,
    startPos: number,
  ): { token: string; endPos: number } | undefined {
    const len = measureData.length;
    const noteRegex = /[A-Ga-gz]/;

    // 提取连音数量（n）
    let nStr = '';
    let i = startPos + 1;
    while (i < len && /\d/.test(measureData[i])) {
      nStr += measureData[i];
      i++;
    }
    const n = parseInt(nStr, 10);
    if (isNaN(n) || n < 2) {
      // 连音数量至少为2
      return undefined;
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
        const noteResult = this.extractNote(measureData, currentPos);
        tupletNotes.push(noteResult.token);
        currentPos = noteResult.endPos;
      } else {
        // 遇到非音符字符，终止连音收集（如闭括号、其他符号）
        break;
      }
    }

    // 组合连音token（保留原始格式）
    const tupletToken = `(${n}${measureData.slice(i, currentPos).replace(/\s+/g, ' ')})`;
    return {
      token: tupletToken.trim(),
      endPos: currentPos,
    };
  }

  /**
   * 提取单个音符 token
   *
   * @param measureData - 小节数据
   * @param startPos - 起始位置
   * @returns 音符 token 和结束位置
   */
  private static extractNote(
    measureData: string,
    startPos: number,
  ): { token: string; endPos: number } {
    const len = measureData.length;
    let noteEnd = startPos;

    // 音符后可跟：变音符号(^_=)、变音记号(#b)、八度符号(',")、时值(数字)、附点(.)
    while (
      noteEnd + 1 < len &&
      /[\^_=#b',.\d]/.test(measureData[noteEnd + 1])
    ) {
      noteEnd++;
    }
    noteEnd++; // 包含音符起始字符

    return {
      token: measureData.slice(startPos, noteEnd),
      endPos: noteEnd,
    };
  }
}
