import { describe, expect, it } from 'vitest';

import {
  SimpleNotation,
  SNConfig,
  SNRuntime,
  Logger,
  SNPlayer,
  SNEvent,
  SNLoader,
  SNContent,
  SNInfo,
  SNScore,
  SNMeasure,
  SNNote,
  SNStave,
  SNBorderLayer,
  SNTransition,
} from './index';
import { SNChordLayer, SNPointerLayer, SNTieLineLayer } from '@layers';

describe('lib/index.ts', () => {
  it('应该成功导出 SimpleNotation', () => {
    expect(SimpleNotation).toBeDefined();
  });

  it('应该成功导出 config 中的内容', () => {
    expect(SNConfig).toBeDefined();
    expect(SNRuntime).toBeDefined();
  });

  it('应该成功导出 utils 中的内容', () => {
    expect(Logger).toBeDefined();
    expect(SNTransition).toBeDefined();
  });

  it('应该成功导出 core 中的内容', () => {
    expect(SNPlayer).toBeDefined();
    expect(SNEvent).toBeDefined();
    expect(SNLoader).toBeDefined();
  });

  it('应该成功导出 components 中的内容', () => {
    expect(SNContent).toBeDefined();
    expect(SNInfo).toBeDefined();
    expect(SNScore).toBeDefined();
    expect(SNStave).toBeDefined();
    expect(SNMeasure).toBeDefined();
    expect(SNNote).toBeDefined();
  });

  it('应该成功导出 layers 中的内容', () => {
    expect(SNBorderLayer).toBeDefined();
    expect(SNChordLayer).toBeDefined();
    expect(SNPointerLayer).toBeDefined();
    expect(SNTieLineLayer).toBeDefined();
  });
});
