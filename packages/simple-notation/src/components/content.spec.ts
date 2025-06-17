import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SNContent } from './content';
import { SNBoxType } from '@types';
import { SimpleNotation } from '../sn';
import { SNConfig, SNRuntime } from '@config';
import { SNInfo } from './info';
import { SNScore } from './score';
import { Logger, SvgUtils } from '@utils';
import { SNBox } from '@core';

// 模拟 @core 模块，特别是 SNBox
vi.mock('@core', () => {
  const mockSNBox = vi.fn().mockImplementation(function (
    this: any,
    ...args: any[]
  ) {
    this.width = 0;
    this.height = 0;
    this.padding = { left: 0, right: 0, top: 0, bottom: 0 };
    this.x = 0;
    this.y = 0;
    this.el = { appendChild: vi.fn(), remove: vi.fn() };
    this.setHeight = vi.fn();
    this.drawBorderBox = vi.fn();
  });
  return { SNBox: mockSNBox };
});

// 模拟 SimpleNotation 模块
vi.mock('../sn', () => {
  const mockRootEl = { appendChild: vi.fn() };
  const mockSimpleNotation = vi.fn(() => ({
    width: 800,
    height: 600,
    el: mockRootEl,
  }));
  return { SimpleNotation: mockSimpleNotation };
});

// 模拟 @config 模块
vi.mock('@config', () => {
  const mockSNConfig = {
    debug: { borderbox: { content: false } },
    info: {},
    score: {},
  };
  const mockSNRuntime = {
    info: {},
  };
  return { SNConfig: mockSNConfig, SNRuntime: mockSNRuntime };
});

// 模拟 ./info 模块 - 每次调用 new SNInfo() 返回一个新的模拟实例
vi.mock('./info', () => {
  const SNInfo = vi.fn(() => ({
    el: { remove: vi.fn() },
    draw: vi.fn(),
    height: 100, // 模拟一个固定高度
  }));
  return { SNInfo };
});

// 模拟 ./score 模块 - 每次调用 new SNScore() 返回一个新的模拟实例
vi.mock('./score', () => {
  const SNScore = vi.fn(() => ({
    el: { remove: vi.fn() },
    draw: vi.fn(),
    height: 200, // 模拟一个固定高度
  }));
  return { SNScore };
});

// 模拟 @utils 模块
const mockSvgGElement = { appendChild: vi.fn(), remove: vi.fn() };
vi.mock('@utils', () => {
  const mockLogger = { debug: vi.fn() };
  const mockSvgUtils = {
    createG: vi.fn(() => mockSvgGElement), // 每次返回同一个模拟对象，因为 content.el 应该只有一个
  };
  return { Logger: mockLogger, SvgUtils: mockSvgUtils };
});

describe('SNContent', () => {
  let mockRoot: SimpleNotation;
  let mockOptions: any;

  beforeEach(() => {
    vi.clearAllMocks(); // 清除所有 mock 的调用记录和实例
    mockRoot = new SimpleNotation(document.createElement('div'));
    mockOptions = { padding: { left: 10, right: 10, top: 10, bottom: 10 } };
  });

  it('应该正确初始化内容容器', () => {
    const content = new SNContent(mockRoot, mockOptions);

    // 验证 Logger.debug 被调用
    expect(Logger.debug).toHaveBeenCalledWith(
      'constructor 初始化内容节点',
      'SNContent',
    );

    // 验证 SNBox 构造函数被调用
    expect(SNBox).toHaveBeenCalledWith(
      mockRoot,
      SNBoxType.CONTENT,
      0,
      0,
      mockRoot.width,
      mockRoot.height,
      mockOptions.padding,
    );

    // 验证 SvgUtils.createG 被调用，并验证 content.el 是 mockSvgGElement
    expect(SvgUtils.createG).toHaveBeenCalledWith({ tag: 'content' });
    expect(content.el).toBe(mockSvgGElement);

    // 验证 content.el 被添加到 root.el
    expect(mockRoot.el.appendChild).toHaveBeenCalledWith(content.el);

    // 验证 SNInfo 和 SNScore 实例被创建
    // 获取 SNInfo 和 SNScore 构造函数第一次调用的结果（即在 SNContent 构造函数中创建的实例）
    const initialInfoInstance = (SNInfo as any).mock.results[0].value;
    const initialScoreInstance = (SNScore as any).mock.results[0].value;

    expect(content.info).toBe(initialInfoInstance);
    expect(content.score).toBe(initialScoreInstance);

    // 验证 drawInfo 和 drawScore 被调用
    expect(initialInfoInstance.draw).toHaveBeenCalledWith(SNRuntime.info);
    expect(initialScoreInstance.draw).toHaveBeenCalled();

    // 从 mock 实例中获取 setHeight 和 drawBorderBox
    const snBoxInstance = (SNBox as any).mock.results[0].value;
    const expectedHeight =
      initialInfoInstance.height + initialScoreInstance.height;
    expect(snBoxInstance.setHeight).toHaveBeenCalledWith(expectedHeight, false);

    // 验证 drawBorderBox 被调用
    expect(snBoxInstance.drawBorderBox).toHaveBeenCalledWith(
      SNBoxType.CONTENT,
      SNConfig.debug.borderbox?.content,
    );
  });

  it('drawInfo 应该更新信息区域', () => {
    const content = new SNContent(mockRoot, mockOptions);
    const initialInfo = content.info!; // 初始的 info 实例
    const initialInfoRemoveSpy = initialInfo.el.remove;

    // 清除 SNInfo 构造函数的调用记录，以便检查 drawInfo 中的新实例创建
    (SNInfo as any).mockClear();

    const newInfoData = { title: 'New Title' };
    content.drawInfo(newInfoData);

    expect(initialInfoRemoveSpy).toHaveBeenCalled(); // 验证旧实例的 remove 被调用
    expect(SNInfo).toHaveBeenCalledTimes(1); // 验证 SNInfo 构造函数被再次调用一次
    const newInfoInstance = (SNInfo as any).mock.results[0].value; // 获取新创建的 info 实例
    expect(content.info).toBe(newInfoInstance); // 验证 content.info 指向新实例
    expect(newInfoInstance.draw).toHaveBeenCalledWith(newInfoData); // 验证新实例的 draw 被调用
  });

  it('drawScore 应该更新谱面区域', () => {
    const content = new SNContent(mockRoot, mockOptions);
    const initialScore = content.score!; // 初始的 score 实例
    const initialScoreRemoveSpy = initialScore.el.remove;

    // 清除 SNScore 构造函数的调用记录
    (SNScore as any).mockClear();

    content.drawScore();

    expect(initialScoreRemoveSpy).toHaveBeenCalled(); // 验证旧实例的 remove 被调用
    expect(SNScore).toHaveBeenCalledTimes(1); // 验证 SNScore 构造函数被再次调用一次
    const newScoreInstance = (SNScore as any).mock.results[0].value; // 获取新创建的 score 实例
    expect(content.score).toBe(newScoreInstance); // 验证 content.score 指向新实例
    expect(newScoreInstance.draw).toHaveBeenCalled(); // 验证新实例的 draw 被调用
  });

  it('destroyed 应该移除内容元素', () => {
    const content = new SNContent(mockRoot, mockOptions);
    const contentElRemoveSpy = content.el.remove; // 获取对 el 的 remove 方法的引用

    content.destroyed();

    expect(contentElRemoveSpy).toHaveBeenCalled();
  });
});
