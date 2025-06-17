import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SNScore } from './score';
import {
  SNBoxType,
  SNScoreOptions,
  SNStaveOptions,
  SNStaveType,
  SNChordType,
  SNScoreType,
} from '@types';
import { SNContent } from './content';
import { SNBox } from '@core';
import { Logger, SvgUtils } from '@utils';
import { SNConfig } from '@config';
import { SNStave } from './stave';
import { SNRuntime } from '../config/runtime';
import {
  SNBeamLayer,
  SNChordLayer,
  SNPointerLayer,
  SNTieLineLayer,
} from '@layers';

// 模拟 @types 模块，确保枚举在所有 mock 和测试中可用
vi.mock('@types', () => ({
  SNBoxType: {
    INFO: 'Info',
    SCORE: 'Score',
    CONTENT: 'Content',
  },
  SNChordType: {
    Default: 'Default',
  },
  SNScoreType: {
    Simple: 'Simple',
  },
  SNStaveType: {
    DefaultLine: 'DefaultLine',
    // 如果有其他 SNStaveType，也在此处添加
  },
  // 其他可能被导入的类型，如果仅作类型使用，可提供空对象
  SNScoreOptions: {},
  SNStaveOptions: {},
  SNDataInfo: {},
  SNContentOptions: {},
}));

// 模拟 @core 模块，特别是 SNBox
vi.mock('@core', () => {
  const mockSNBox = vi.fn().mockImplementation(function (
    this: any,
    ...args: any[]
  ) {
    this.width = 0;
    this.height = 0;
    this.padding = [0, 0, 0, 0];
    this.x = 0;
    this.y = 0;
    this.innerX = 0;
    this.innerY = 0;
    this.innerWidth = 0;
    this.el = { appendChild: vi.fn(), remove: vi.fn() };
  });

  // 在模拟构造函数的原型上定义方法，以便可以对它们进行 spyOn
  mockSNBox.prototype.setHeight = vi.fn();
  mockSNBox.prototype.drawBorderBox = vi.fn();

  return { SNBox: mockSNBox };
});

// 模拟 ./content 模块
vi.mock('./content', () => {
  const mockContentEl = { appendChild: vi.fn(), remove: vi.fn() };
  const mockSNContent = vi.fn(() => ({
    el: mockContentEl,
    innerX: 50,
    innerY: 50,
    innerWidth: 700,
    info: { height: 100 },
    innerHeight: 500, // 增加 innerHeight 模拟值
  }));
  return { SNContent: mockSNContent };
});

// 模拟 @utils 模块
vi.mock('@utils', () => {
  const createMockSvgElement = () => ({
    appendChild: vi.fn(),
    remove: vi.fn(),
    setAttribute: vi.fn(),
  });
  const mockSvgUtils = {
    createG: vi.fn(() => createMockSvgElement()),
    createLine: vi.fn(() => createMockSvgElement()),
  };
  const mockLogger = { warn: vi.fn() };
  return { SvgUtils: mockSvgUtils, Logger: mockLogger };
});

// 模拟 @config 模块
vi.mock('@config', () => {
  const mockSNConfig = {
    debug: { borderbox: { score: false } },
    score: {
      chordHeight: 20,
      lineHeight: 20,
      showChordLine: true,
      chordLineHeight: 10,
      lineSpace: 50,
      lyricHeight: 15,
      lineWeight: 1,
      allowOverWeight: 0,
      chordType: 'Default' as SNChordType,
      scoreType: 'Simple' as SNScoreType,
    },
  };
  return { SNConfig: mockSNConfig };
});

// 模拟 ./stave 模块
vi.mock('./stave', () => {
  const mockSNStave = vi.fn(() => ({
    measures: [], // 模拟 measures 属性
  }));
  return { SNStave: mockSNStave };
});

// 模拟 ../config/runtime 模块
vi.mock('../config/runtime', () => {
  const mockSNRuntime = {
    parsedScore: [],
    lyric: '', // 修改为字符串类型
  };
  return { SNRuntime: mockSNRuntime };
});

// 模拟 @layers 模块
vi.mock('@layers', () => {
  const mockLayerInstance = { draw: vi.fn() };

  // 模拟 SNBeamLayer 既是构造函数又包含静态方法
  // 创建一个 vi.fn() 作为构造函数，这样可以追踪其调用
  const MockSNBeamLayer = vi.fn(function (this: any, ...args: any[]) {
    // 如果 SNBeamLayer 的实例方法需要在测试中被调用，可以在这里定义
    // 例如：this.instanceMethod = vi.fn();
    // 当前 SNBeamLayer 构造函数在业务代码中没有实例方法被调用，所以这里可以为空。
    // 如果需要，可以将 mockLayerInstance 的属性复制到实例上：
    // Object.assign(this, mockLayerInstance);
  }) as any; // 使用 as any 强制类型转换，以允许添加静态属性

  // 为 MockSNBeamLayer 添加静态 draw 方法，使其成为一个 spy
  MockSNBeamLayer.draw = vi.fn();

  return {
    SNBeamLayer: MockSNBeamLayer,
    SNChordLayer: vi.fn(() => mockLayerInstance),
    SNPointerLayer: vi.fn(() => mockLayerInstance),
    SNTieLineLayer: vi.fn(() => mockLayerInstance),
  };
});

describe('SNScore', () => {
  let mockContent: SNContent;
  let mockOptions: SNScoreOptions;
  let snBoxSetHeightSpy: any; // 新增 spy 变量
  let snBoxDrawBorderBoxSpy: any; // 新增 spy 变量

  beforeEach(() => {
    vi.clearAllMocks();

    // 对 SNBox 的原型方法进行 spy
    snBoxSetHeightSpy = vi.spyOn(SNBox.prototype, 'setHeight' as any);
    snBoxDrawBorderBoxSpy = vi.spyOn(SNBox.prototype, 'drawBorderBox' as any);

    mockContent = new SNContent(document.createElement('div') as any, {
      padding: [0, 0, 0, 0],
      infoShow: true,
    });
    // 为 mockOptions 提供所有必需的属性
    mockOptions = {
      padding: [0, 0, 0, 0],
      lineHeight: 20,
      lineSpace: 50,
      lyricHeight: 15,
      chordHeight: 20,
      lineWeight: 1,
      allowOverWeight: 0,
      chordType: 'Default' as SNChordType,
      scoreType: 'Simple' as SNScoreType,
      showChordLine: true,
      chordLineHeight: 10,
    };
  });

  afterEach(() => {
    // 恢复 SNBox 的原型方法
    if (snBoxSetHeightSpy) snBoxSetHeightSpy.mockRestore();
    if (snBoxDrawBorderBoxSpy) snBoxDrawBorderBoxSpy.mockRestore();
  });

  it('应该正确初始化谱面容器', () => {
    const score = new SNScore(mockContent, mockOptions);

    // 验证 SNBox 构造函数被调用
    expect(SNBox).toHaveBeenCalledWith(
      mockContent,
      SNBoxType.SCORE,
      mockContent.innerX,
      mockContent.innerY + (mockContent.info?.height || 0),
      mockContent.innerWidth,
      mockContent.innerHeight - (mockContent.info?.height || 0),
      mockOptions.padding,
    );

    // 验证 SvgUtils.createG 被调用
    expect(SvgUtils.createG).toHaveBeenCalledWith({ tag: 'score' });
    expect(score.el).toBeDefined();

    // 验证图层被实例化
    expect(SNTieLineLayer).toHaveBeenCalledTimes(1);
    expect(SNPointerLayer).toHaveBeenCalledTimes(1);
    expect(SNChordLayer).toHaveBeenCalledTimes(1);
    expect(SNBeamLayer).toHaveBeenCalledTimes(1);

    // 验证 score.el 被添加到 content.el
    expect(mockContent.el.appendChild).toHaveBeenCalledWith(score.el);
  });

  describe('draw', () => {
    it('当没有谱面数据时，应该记录警告', () => {
      SNRuntime.parsedScore = [];
      const score = new SNScore(mockContent, mockOptions);
      score.draw();

      expect(Logger.warn).toHaveBeenCalledWith(
        '没有找到谱面数据,请确认已经使用loadData加载数据',
        'SNScore',
      );
      expect(SNStave).not.toHaveBeenCalled();
      expect(snBoxSetHeightSpy).not.toHaveBeenCalled(); // 使用 spy
      expect(SNBeamLayer.draw).not.toHaveBeenCalled();
      expect(snBoxDrawBorderBoxSpy).not.toHaveBeenCalled(); // 使用 spy
    });

    it('应该根据谱面数据绘制谱面和图层', () => {
      SNRuntime.parsedScore = [
        {
          type: SNStaveType.DefaultLine,
          index: 1,
          weight: 1,
          measureOptions: [],
          y: 0,
          endLine: false,
        },
        {
          type: SNStaveType.DefaultLine,
          index: 2,
          weight: 1,
          measureOptions: [],
          y: 0,
          endLine: false,
        },
      ];
      SNRuntime.lyric = 'test';

      const score = new SNScore(mockContent, mockOptions);
      score.draw();

      expect(SNStave).toHaveBeenCalledTimes(2);
      expect(SNStave).toHaveBeenCalledWith(
        score,
        expect.objectContaining({ index: 1 }),
      );
      expect(SNStave).toHaveBeenCalledWith(
        score,
        expect.objectContaining({ index: 2 }),
      );

      const expectedHeightPerStave =
        SNConfig.score.chordHeight +
        SNConfig.score.lineHeight +
        SNConfig.score.chordLineHeight +
        SNConfig.score.lineSpace +
        SNConfig.score.lyricHeight;
      const expectedTotalHeight =
        expectedHeightPerStave * 2 + SNConfig.score.lineSpace;
      expect(snBoxSetHeightSpy).toHaveBeenCalledWith(expectedTotalHeight);

      expect(SNBeamLayer.draw).toHaveBeenCalledWith(expect.any(Array));

      expect(snBoxDrawBorderBoxSpy).toHaveBeenCalledWith(
        SNBoxType.SCORE,
        SNConfig.debug.borderbox?.score,
      );
    });

    it('应该处理分页符', () => {
      const mockStaveOptions: SNStaveOptions[] = [];
      for (let i = 0; i < 10; i++) {
        mockStaveOptions.push({
          type: SNStaveType.DefaultLine,
          index: i + 1,
          weight: 1,
          measureOptions: [],
          y: 0,
          endLine: false,
        });
      }
      SNRuntime.parsedScore = mockStaveOptions;
      SNRuntime.lyric = '';

      const score = new SNScore(mockContent, mockOptions);
      score.draw();

      expect(SvgUtils.createLine).toHaveBeenCalled();
      expect(SvgUtils.createLine).toHaveBeenCalledWith(
        expect.objectContaining({
          stroke: 'transparent',
        }),
      );
    });

    it('不应该为非 DefaultLine 类型的 stave 选项创建 SNStave', () => {
      SNRuntime.parsedScore = [
        {
          type: SNStaveType.DefaultLine,
          index: 1,
          weight: 1,
          measureOptions: [],
          y: 0,
          endLine: false,
        },
        {
          type: 'OtherLineType' as SNStaveType,
          index: 2,
          weight: 1,
          measureOptions: [],
          y: 0,
          endLine: false,
        },
      ];

      const score = new SNScore(mockContent, mockOptions);
      score.draw();

      expect(SNStave).toHaveBeenCalledTimes(1);
      expect(SNStave).toHaveBeenCalledWith(
        score,
        expect.objectContaining({ index: 1 }),
      );
      expect(SNStave).not.toHaveBeenCalledWith(
        score,
        expect.objectContaining({ type: 'OtherLineType' }),
      );
    });
  });
});
