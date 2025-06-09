import { describe, it, expect, beforeEach } from 'vitest';
import { SNConfig } from './config';
import { SNChordType, SNScoreType } from '@types';

// Mock HTMLDivElement for testing purposes
class MockHTMLDivElement implements Partial<HTMLElement> {
  clientWidth: number;
  clientHeight: number;
  constructor(width: number, height: number) {
    this.clientWidth = width;
    this.clientHeight = height;
  }
}

/**
 * SNConfig 配置类测试
 * 该模块包含对 SNConfig 类及其方法的测试。
 * @module SNConfig
 */
describe('SNConfig 配置类测试', () => {
  let mockContainer: MockHTMLDivElement;

  beforeEach(() => {
    mockContainer = new MockHTMLDivElement(1000, 1200);
  });

  /**
   * 测试 SNConfig 构造函数
   * 应该根据提供的选项或默认值正确初始化配置属性。
   * @function constructor
   */
  it('应该根据提供的选项或默认值正确初始化配置属性', () => {
    // 测试默认初始化
    new SNConfig(mockContainer as HTMLDivElement);
    expect(SNConfig.height).toBe(1200);
    expect(SNConfig.content.infoShow).toBe(true);
    expect(SNConfig.score.chordHeight).toBe(0);
    expect(SNConfig.debug).toEqual({});

    // 测试自定义选项初始化
    const customOptions = {
      width: 800,
      height: 600,
      content: { infoShow: false, padding: 15 },
      info: { height: 100, padding: 5 },
      score: { lineHeight: 60, chordType: SNChordType.Guitar },
      debug: true,
    };
    new SNConfig(mockContainer as HTMLDivElement, customOptions);
    expect(SNConfig.width).toBe(800);
    expect(SNConfig.height).toBe(600);
    expect(SNConfig.content.infoShow).toBe(false);
    expect(SNConfig.info.height).toBe(100);
    expect(SNConfig.score.lineHeight).toBe(60);
    expect(SNConfig.score.chordType).toBe(SNChordType.Guitar);
    expect(SNConfig.debug).not.toEqual({});
  });

  /**
   * 测试 update 方法
   * 应该正确更新配置属性，并处理部分更新和合并。
   * @function update
   */
  it('应该正确更新配置属性', () => {
    new SNConfig(mockContainer as HTMLDivElement);

    // 更新部分属性
    SNConfig.update({ width: 700, score: { chordHeight: 30 } });
    expect(SNConfig.width).toBe(700);
    expect(SNConfig.height).toBe(1200); // 未更新的属性保持不变
    expect(SNConfig.score.chordHeight).toBe(30);
    expect(SNConfig.score.lineHeight).toBe(50); // 其他 score 属性应合并而不是覆盖

    // 更新所有属性
    const newOptions = {
      width: 900,
      height: 700,
      content: { infoShow: false, padding: 20 },
      info: { height: 110, padding: 10 },
      score: { scoreType: SNScoreType.Simple },
      debug: true,
    };
    SNConfig.update(newOptions);
    expect(SNConfig.width).toBe(900);
    expect(SNConfig.height).toBe(700);
    expect(SNConfig.content.infoShow).toBe(false);
    expect(SNConfig.info.height).toBe(110);
    expect(SNConfig.score.scoreType).toBe(SNScoreType.Simple);
    expect(SNConfig.debug).not.toEqual({});
  });

  /**
   * 测试 reset 方法
   * 应该将配置重置为默认值或提供的初始值。
   * @function reset
   */
  it('应该将配置重置为默认值或提供的初始值', () => {
    // 修改一些属性以进行测试
    new SNConfig(mockContainer as HTMLDivElement, {
      width: 100,
      score: { chordHeight: 100 },
    }); // Cast to HTMLDivElement

    // 重置为默认值 (无参数调用 reset)
    SNConfig.reset();
    expect(SNConfig.width).toBe(500); // 默认宽度
    expect(SNConfig.height).toBe(800); // 默认高度
    expect(SNConfig.score.chordHeight).toBe(0); // 默认 chordHeight
    expect(SNConfig.content.infoShow).toBe(true); // 默认 infoShow

    // 重置并提供新的初始值
    SNConfig.reset({ width: 750, info: { padding: 25, height: 120 } });
    expect(SNConfig.width).toBe(750);
    expect(SNConfig.info.padding).toBe(25);
    expect(SNConfig.height).toBe(800); // 未覆盖的属性仍为默认值
  });
});
