// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { SvgUtils } from './svg';

describe('SvgUtils', () => {
  it('should create a basic svg element', () => {
    const svg = SvgUtils.createSvg(100, 200);
    expect(svg).not.toBeNull();
    expect(svg.localName).toBe('svg');
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.getAttribute('width')).toBe('100');
    expect(svg.getAttribute('height')).toBe('200');
  });

  it('should create a basic g element', () => {
    const g = SvgUtils.createG({ tag: 'test-group' });
    expect(g).not.toBeNull();
    expect(g.localName).toBe('g');
    expect(g.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(g.getAttribute('sn-tag')).toBe('test-group');
  });

  it('should create a basic text element', () => {
    const text = SvgUtils.createText({ x: 10, y: 20, text: 'Hello' });
    expect(text).not.toBeNull();
    expect(text.localName).toBe('text');
    expect(text.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(text.textContent).toBe('Hello');
    expect(text.getAttribute('x')).toBe('10');
    expect(text.getAttribute('y')).toBe('20');
  });

  it('should create a basic tspan element', () => {
    const tspan = SvgUtils.createTspan({ text: 'World' });
    expect(tspan).not.toBeNull();
    expect(tspan.localName).toBe('tspan');
    expect(tspan.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(tspan.textContent).toBe('World');
  });

  it('should create a basic rect element', () => {
    const rect = SvgUtils.createRect({ x: 0, y: 0, width: 50, height: 30 });
    expect(rect).not.toBeNull();
    expect(rect.localName).toBe('rect');
    expect(rect.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(rect.getAttribute('width')).toBe('50');
    expect(rect.getAttribute('height')).toBe('30');
  });

  it('should create a basic line element', () => {
    const line = SvgUtils.createLine({ x1: 0, y1: 0, x2: 10, y2: 10 });
    expect(line).not.toBeNull();
    expect(line.localName).toBe('line');
    expect(line.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(line.getAttribute('x1')).toBe('0');
    expect(line.getAttribute('y1')).toBe('0');
    expect(line.getAttribute('x2')).toBe('10');
    expect(line.getAttribute('y2')).toBe('10');
  });

  it('should create a basic arc element', () => {
    const arc = SvgUtils.createArc({
      x1: 10,
      y1: 10,
      x2: 20,
      y2: 20,
      radiusX: 5,
      radiusY: 5,
      rotation: 0,
      largeArcFlag: false,
      sweepFlag: true,
    });
    expect(arc).not.toBeNull();
    expect(arc.localName).toBe('path');
    expect(arc.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(arc.getAttribute('d')).toContain('A 5 5 0 0 1 20 20'); // Basic path 'd' attribute check
  });

  it('should create repeat dots g element', () => {
    const dotsGroup = SvgUtils.createRepeatDots(50, 50, 'left');
    expect(dotsGroup).not.toBeNull();
    expect(dotsGroup.localName).toBe('g');
    expect(dotsGroup.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(dotsGroup.children.length).toBe(2); // Should contain two circles
    expect(dotsGroup.children[0].localName).toBe('circle');
    expect(dotsGroup.children[0].namespaceURI).toBe(
      'http://www.w3.org/2000/svg',
    );
    expect(dotsGroup.children[1].localName).toBe('circle');
    expect(dotsGroup.children[1].namespaceURI).toBe(
      'http://www.w3.org/2000/svg',
    );
  });

  it('should create a basic guitar chord diagram g element', () => {
    const chordDiagram = SvgUtils.createGuitarChordDiagram('C', [
      null,
      3,
      2,
      0,
      1,
      0,
    ]);
    expect(chordDiagram).not.toBeNull();
    expect(chordDiagram.localName).toBe('g');
    expect(chordDiagram.namespaceURI).toBe('http://www.w3.org/2000/svg');
    // Further checks could be added to verify contents if needed, but basic creation is tested.
  });
});
