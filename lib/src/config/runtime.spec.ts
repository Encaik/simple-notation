import { describe, it, expect, beforeEach } from 'vitest';
import { SNRuntime } from './runtime';
import { SNDataInfo, SNDataType, SNRuntimeOptions } from '@types';

/**
 * SNRuntime 运行时数据管理类测试
 * 该模块包含对 SNRuntime 类及其数据处理方法的测试。
 * @module SNRuntime
 */
describe('SNRuntime 运行时数据管理类测试', () => {
  const defaultInfo: SNDataInfo = {
    title: '测试歌曲',
    composer: '测试作曲',
    lyricist: '测试作词',
    time: '4/4',
    tempo: '快板',
    key: 'C',
    beat: '1=C',
  };

  const defaultScore = '1 2 3 4 | 5 6 7 1.';
  const defaultLyric = '我 的 歌';

  const defaultOptions: SNRuntimeOptions = {
    info: defaultInfo,
    score: defaultScore,
    lyric: defaultLyric,
    parsedScore: [],
    splitLyrics: [],
    type: SNDataType.TEMPLATE,
  };

  beforeEach(() => {
    SNRuntime.clear();
    new SNRuntime(defaultOptions);
  });

  /**
   * 测试 SNRuntime 构造函数
   * 应该根据提供的选项正确初始化运行时数据属性。
   * @function constructor
   */
  it('应该根据提供的选项正确初始化运行时数据属性', () => {
    expect(SNRuntime.info).toEqual(defaultInfo);
    expect(SNRuntime.score).toBe(defaultScore);
    expect(SNRuntime.lyric).toBe(defaultLyric);
    expect(SNRuntime.parsedScore).toEqual([]);
    expect(SNRuntime.splitLyrics).toEqual([]);
    expect(SNRuntime.type).toBe(SNDataType.TEMPLATE);
  });

  /**
   * 测试 getTitle 方法
   * 应该返回乐谱的标题。
   * @function getTitle
   */
  it('应该返回乐谱的标题', () => {
    expect(SNRuntime.getTitle()).toBe('测试歌曲');
    SNRuntime.info.title = '新标题';
    expect(SNRuntime.getTitle()).toBe('新标题');
  });

  /**
   * 测试 clear 方法
   * 应该将所有运行时数据属性重置为默认空值。
   * @function clear
   */
  it('应该将所有运行时数据属性重置为默认空值', () => {
    SNRuntime.clear();
    expect(SNRuntime.info).toEqual({
      title: '',
      composer: '',
      lyricist: '',
      time: '',
      tempo: '',
      key: undefined,
      beat: '',
    });
    expect(SNRuntime.score).toBe('');
    expect(SNRuntime.parsedScore).toEqual([]);
    expect(SNRuntime.lyric).toBe('');
    expect(SNRuntime.splitLyrics).toEqual([]);
  });

  /**
   * 测试 splitLyric 方法
   * 应该正确拆分歌词字符串，支持单行、多行、中英文、标点和括号。
   * @function splitLyric
   */
  describe('splitLyric 方法', () => {
    /**
     * 应该正确拆分包含中文、英文单词和标点的单行歌词。
     * @test
     */
    it('应该正确拆分包含中文、英文单词和标点的单行歌词', () => {
      expect(SNRuntime.splitLyric('你好世界，Hello World!')).toEqual([
        '你',
        '好',
        '世',
        '界，',
        'Hello',
        'World!',
      ]);
      expect(SNRuntime.splitLyric('A B C.')).toEqual(['A', 'B', 'C.']);
      expect(SNRuntime.splitLyric('中文单词.')).toEqual([
        '中',
        '文',
        '单',
        '词.',
      ]);
    });

    /**
     * 应该正确拆分包含括号内容的歌词。
     * @test
     */
    it('应该正确拆分包含括号内容的歌词', () => {
      expect(SNRuntime.splitLyric('这是一段(括号内容)歌词。')).toEqual([
        '这',
        '是',
        '一',
        '段',
        '括号内容',
        '歌',
        '词。',
      ]);
      expect(SNRuntime.splitLyric('Another（example）here')).toEqual([
        'Another',
        'example',
        'here',
      ]);
    });

    /**
     * 应该正确拆分竖排多行歌词格式。
     * @test
     */
    it('应该正确拆分竖排多行歌词格式', () => {
      const multiLineLyric = '我的[1.第一部分][2.第二部分][3.第三部分]都结束了';
      expect(SNRuntime.splitLyric(multiLineLyric)).toEqual([
        '我',
        '的',
        ['第', '第', '第'],
        ['一', '二', '三'],
        ['部', '部', '部'],
        ['分', '分', '分'],
        '都',
        '结',
        '束',
        '了',
      ]);

      const mixedMultiLine = '前半段[1.上][2.下]后半段';
      expect(SNRuntime.splitLyric(mixedMultiLine)).toEqual([
        '前',
        '半',
        '段',
        ['上', '下'],
        '后',
        '半',
        '段',
      ]);
    });

    /**
     * 应该处理空字符串和只包含空格的歌词。
     * @test
     */
    it('应该处理空字符串和只包含空格的歌词', () => {
      expect(SNRuntime.splitLyric('')).toEqual([]);
      expect(SNRuntime.splitLyric('   ')).toEqual([]);
    });

    /**
     * 应该正确处理连续的英文单词和数字，并跳过内部空格。
     * @test
     */
    it('应该正确处理连续的英文单词和数字，并跳过内部空格', () => {
      expect(SNRuntime.splitLyric('abc def123 ghi')).toEqual([
        'abc',
        'def123',
        'ghi',
      ]);
      expect(SNRuntime.splitLyric('wordAwordB')).toEqual(['wordAwordB']);
    });
  });
});
