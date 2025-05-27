import { describe, expect, it } from 'vitest';
import { SimpleNotation } from './sn';

describe('SimpleNotation', () => {
  it('should create a new instance', () => {
    const container = document.createElement('div');
    const sn = new SimpleNotation(container);
    expect(sn).toBeInstanceOf(SimpleNotation);
  });
});
