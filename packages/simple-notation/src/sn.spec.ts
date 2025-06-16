import { describe, expect, it } from 'vitest';
import { SimpleNotation } from './sn';
import { Logger } from '@utils';

describe('SimpleNotation', () => {
  it('should create a new instance', () => {
    const container = document.createElement('div');
    const sn = new SimpleNotation(container);
    expect(sn).toBeInstanceOf(SimpleNotation);
  });

  it('should throw an error when container is null', () => {
    expect(() => new SimpleNotation(null!)).toThrow('container is null');
  });

  it('should set debug mode correctly', () => {
    const container = document.createElement('div');
    new SimpleNotation(container, { debug: true });
    expect(Logger.isDebugMode).toBe(true);
  });

  it('should initialize with default options', () => {
    const container = document.createElement('div');
    const sn = new SimpleNotation(container);
    expect(sn.el.getAttribute('width')).toBe('500');
    expect(sn.el.getAttribute('height')).toBe('800');
  });

  it('should initialize with custom options', () => {
    const container = document.createElement('div');
    const sn = new SimpleNotation(container, { width: 600, height: 400 });
    expect(sn.el.getAttribute('width')).toBe('600');
    expect(sn.el.getAttribute('height')).toBe('400');
  });
});
