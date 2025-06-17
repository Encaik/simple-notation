import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SNInfo } from './info';
import { SNBoxType, SNDataInfo, SNContentOptions } from '@types';
import { SNContent } from './content';
import { SNBox } from '@core';
import { SvgUtils, UnicodeMusicSymbols } from '@utils';
import { SNConfig } from '@config';

// 模拟 @core 模块，特别是 SNBox
vi.mock('@core', () => {
  const mockSNBox = vi.fn().mockImplementation(function (this: any) {
    this.width = 0;
    this.height = 0;
    this.padding = [0, 0, 0, 0];
    this.x = 0;
    this.y = 0;
    this.innerX = 0;
    this.innerY = 0;
    this.innerWidth = 0;
    this.el = { appendChild: vi.fn(), remove: vi.fn() };
    this.setHeight = vi.fn();
    this.drawBorderBox = vi.fn();
  });
  return { SNBox: mockSNBox };
});

// 模拟 ./content 模块
vi.mock('./content', () => {
  const mockContentEl = { appendChild: vi.fn(), remove: vi.fn() };
  const mockInfoInstance = {
    height: 100,
    draw: vi.fn(), // 模拟 draw 方法
    el: { remove: vi.fn() },
  };

  // 定义一个模拟的 SNContent 实例类，确保方法存在于实例上
  class MockSNContentInstance {
    el = mockContentEl;
    innerX = 50;
    innerY = 50;
    innerWidth = 700;
    info = mockInfoInstance;
    innerHeight = 500;
    drawInfo = vi.fn(); // 明确将方法定义在实例上
    drawScore = vi.fn(); // 明确将方法定义在实例上

    constructor() {
      // 模拟构造函数，不执行实际的初始化逻辑
    }
  }

  // 模拟 SNContent 构造函数，使其返回 MockSNContentInstance 的新实例
  const SNContent = vi
    .fn()
    .mockImplementation(() => new MockSNContentInstance());

  return { SNContent };
});

// 模拟 @utils 模块
vi.mock('@utils', () => {
  const createMockSvgElement = () => ({
    appendChild: vi.fn(),
    remove: vi.fn(),
  });

  const mockSvgUtils = {
    createG: vi.fn(() => createMockSvgElement()),
    createText: vi.fn(() => createMockSvgElement()),
    createTspan: vi.fn(() => createMockSvgElement()),
  };
  const mockUnicodeMusicSymbols = {
    createSymbol: vi.fn(() => createMockSvgElement()),
  };
  return {
    SvgUtils: mockSvgUtils,
    UnicodeMusicSymbols: mockUnicodeMusicSymbols,
  };
});

// 模拟 @config 模块
vi.mock('@config', () => {
  const mockSNConfig = {
    debug: { borderbox: { info: false } },
  };
  return { SNConfig: mockSNConfig };
});

describe('SNInfo', () => {
  let mockContent: SNContent;
  let mockOptions: any;
  let infoElMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    infoElMock = { appendChild: vi.fn(), remove: vi.fn() };
    (SvgUtils.createG as any).mockImplementationOnce(() => infoElMock);

    const contentOptions: SNContentOptions = {
      padding: [0, 0, 0, 0],
      infoShow: true,
    };
    mockContent = new SNContent(
      document.createElement('div') as any,
      contentOptions,
    );
    mockOptions = { height: 100, padding: [5, 5, 5, 5] };
  });

  afterEach(() => {
    // 无需恢复 SNContent 的模拟方法，因为它们已在 vi.mock 中定义为 vi.fn()
  });

  it('应该正确初始化信息区域', () => {
    const info = new SNInfo(mockContent, mockOptions);

    expect(SNBox).toHaveBeenCalledWith(
      mockContent,
      SNBoxType.INFO,
      mockContent.innerX,
      mockContent.innerY,
      mockContent.innerWidth,
      mockOptions.height,
      mockOptions.padding,
    );

    expect(SvgUtils.createG).toHaveBeenCalledWith({ tag: 'info' });
    expect(info.el).toBe(infoElMock);

    expect(mockContent.el.appendChild).toHaveBeenCalledWith(info.el);
  });

  describe('drawTitle', () => {
    it('应该在提供标题时绘制标题', () => {
      const info = new SNInfo(mockContent, mockOptions);
      const title = '测试标题';
      info.drawTitle(title);

      expect(SvgUtils.createText).toHaveBeenCalledWith(
        expect.objectContaining({
          text: title,
          fontSize: 30,
          textAnchor: 'middle',
        }),
      );
      const createdTextElement = (SvgUtils.createText as any).mock.results[0]
        .value;
      expect(info.el.appendChild).toHaveBeenCalledWith(createdTextElement);
    });

    it('不应在未提供标题时绘制标题', () => {
      const info = new SNInfo(mockContent, mockOptions);
      info.drawTitle('');
      expect(SvgUtils.createText).not.toHaveBeenCalled();
    });
  });

  describe('parseKeySignature', () => {
    it('应该正确解析升号调', () => {
      const info = new SNInfo(mockContent, mockOptions);
      expect((info as any).parseKeySignature('C#')).toEqual({
        symbol: 'sharp',
        letter: 'C',
      });
      expect((info as any).parseKeySignature('G#')).toEqual({
        symbol: 'sharp',
        letter: 'G',
      });
    });

    it('应该正确解析降号调', () => {
      const info = new SNInfo(mockContent, mockOptions);
      expect((info as any).parseKeySignature('Db')).toEqual({
        symbol: 'flat',
        letter: 'D',
      });
      expect((info as any).parseKeySignature('Eb')).toEqual({
        symbol: 'flat',
        letter: 'E',
      });
    });

    it('应该正确解析小调', () => {
      const info = new SNInfo(mockContent, mockOptions);
      expect((info as any).parseKeySignature('Amin')).toEqual({ letter: 'a' });
      expect((info as any).parseKeySignature('cmin')).toEqual({ letter: 'c' });
    });

    it('应该正确解析大调', () => {
      const info = new SNInfo(mockContent, mockOptions);
      expect((info as any).parseKeySignature('C')).toEqual({ letter: 'C' });
      expect((info as any).parseKeySignature('F')).toEqual({ letter: 'F' });
    });

    it('应该返回其他情况的原始字符串', () => {
      const info = new SNInfo(mockContent, mockOptions);
      expect((info as any).parseKeySignature('Invalid')).toEqual({
        letter: 'Invalid',
      });
    });
  });

  describe('draw', () => {
    let info: SNInfo;
    let drawTitleSpy: any;
    let drawBorderBoxSpy: any;

    beforeEach(() => {
      // 为每个 draw 测试用例创建新的 info 实例
      info = new SNInfo(mockContent, mockOptions);
      // 对公共方法创建 spies
      drawTitleSpy = vi.spyOn(info, 'drawTitle' as any); // Spy on instance
      drawBorderBoxSpy = vi.spyOn(info, 'drawBorderBox' as any); // Spy on instance

      // 直接重置工具函数的模拟调用计数，确保每个测试用例独立
      (SvgUtils.createText as any).mockClear();
      (SvgUtils.createTspan as any).mockClear();
      (UnicodeMusicSymbols.createSymbol as any).mockClear();
    });

    afterEach(() => {
      // 恢复所有 spies，并添加空值检查
      if (drawTitleSpy) drawTitleSpy.mockRestore();
      if (drawBorderBoxSpy) drawBorderBoxSpy.mockRestore();
    });

    it('应该在没有提供选项时不做任何操作', () => {
      info.draw(undefined);
      expect(drawTitleSpy).not.toHaveBeenCalled();
      // 当没有提供选项时，私有方法不应调用任何绘制工具函数
      expect(SvgUtils.createText).not.toHaveBeenCalled();
      expect(SvgUtils.createTspan).not.toHaveBeenCalled();
      expect(UnicodeMusicSymbols.createSymbol).not.toHaveBeenCalled();
      expect(drawBorderBoxSpy).not.toHaveBeenCalled();
    });

    it('应该根据提供的选项调用相应的绘制方法', () => {
      const options: SNDataInfo = {
        title: '测试歌曲',
        composer: '作曲家',
        lyricist: '作词家',
        author: '制谱人',
        key: 'C',
        beat: '4',
        time: '4',
        tempo: '60',
      };
      info.draw(options);

      expect(drawTitleSpy).toHaveBeenCalledWith(options.title);
      // 验证绘制信息会调用 SvgUtils 的相关方法
      expect(SvgUtils.createText).toHaveBeenCalled();
      expect(SvgUtils.createTspan).toHaveBeenCalled();
      expect(UnicodeMusicSymbols.createSymbol).toHaveBeenCalled();
      expect(drawBorderBoxSpy).toHaveBeenCalledWith(
        SNBoxType.INFO,
        SNConfig.debug.borderbox?.info,
      );
    });

    it('应该只调用提供的选项对应的绘制方法', () => {
      const options: SNDataInfo = {
        title: '仅有标题',
      };
      info.draw(options);

      expect(drawTitleSpy).toHaveBeenCalledWith(options.title);
      // 只有 drawTitle 会调用 createText，所以 expect createText 被调用一次
      expect(SvgUtils.createText).toHaveBeenCalledTimes(1);
      expect(SvgUtils.createTspan).not.toHaveBeenCalled(); // 此时 drawCreatorInfo 和 drawMusicInfo 不会绘制，所以不应调用 createTspan
      expect(UnicodeMusicSymbols.createSymbol).not.toHaveBeenCalled(); // 此时 drawMusicInfo 不会绘制，所以不应调用 createSymbol
      expect(drawBorderBoxSpy).toHaveBeenCalledWith(
        SNBoxType.INFO,
        SNConfig.debug.borderbox?.info,
      );
    });
  });
});
