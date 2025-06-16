import { describe, it, expect } from 'vitest';
import { SNTransition } from './transition';

/**
 * SNTransition.General 模块测试
 * 该模块包含通用乐理和简谱数字转换相关方法的测试。
 * @module SNTransition.General
 */
describe('SNTransition.General 通用方法测试', () => {
  /**
   * 测试 noteNameToMidi 方法
   * 将音名（带八度）转换为 MIDI 值。
   * 应该正确转换各种音名格式到 MIDI 值，包括基本音符、升降号、不同八度以及边界情况。
   * @function noteNameToMidi
   */
  it('应该将音名转换为正确的 MIDI 值', () => {
    expect(SNTransition.General.noteNameToMidi('C4')).toBe(60);
    expect(SNTransition.General.noteNameToMidi('C#4')).toBe(61);
    expect(SNTransition.General.noteNameToMidi('C-1')).toBe(0);
    expect(SNTransition.General.noteNameToMidi('G9')).toBe(127);
    expect(SNTransition.General.noteNameToMidi('H4')).toBeNull();
  });

  /**
   * 测试 midiToNoteName 方法
   * 将 MIDI 值转换为音名（带八度）。
   * 应该正确转换各种 MIDI 值到音名，包括基本 MIDI 值、升降号音符和不同八度。
   * @function midiToNoteName
   */
  it('应该将 MIDI 值转换为正确的音名', () => {
    expect(SNTransition.General.midiToNoteName(60)).toBe('C4');
    expect(SNTransition.General.midiToNoteName(61)).toBe('C#4');
    expect(SNTransition.General.midiToNoteName(12)).toBe('C0');
    expect(SNTransition.General.midiToNoteName(127)).toBe('G9');
    expect(SNTransition.General.midiToNoteName(-12)).toBe('C-2');
  });

  /**
   * 测试 simpleNoteToNoteName 方法
   * 将简谱数字和八度、升降号信息转换为音名。
   * 应该正确将简谱数字和八度、升降号信息转换为音名，包括基本转换、八度升降、升降号组合及无效输入。
   * @function simpleNoteToNoteName
   */
  it('应该将简谱数字和八度、升降号信息转换为音名', () => {
    expect(SNTransition.General.simpleNoteToNoteName('1', 0, 0)).toBe('C4');
    expect(SNTransition.General.simpleNoteToNoteName('1', 1, 0)).toBe('C5');
    expect(SNTransition.General.simpleNoteToNoteName('5', -1, 0)).toBe('G3');
    expect(SNTransition.General.simpleNoteToNoteName('1', 0, 1)).toBe('C#4');
    expect(SNTransition.General.simpleNoteToNoteName('0', 0, 0)).toBeNull();
  });

  /**
   * 测试 noteNameToSimpleNote 方法
   * 将音名转换为简谱数字表示。
   * @function noteNameToSimpleNote
   */
  it('应该将音名转换为简谱数字表示', () => {
    expect(SNTransition.General.noteNameToSimpleNote('C4')).toBe('1');
    expect(SNTransition.General.noteNameToSimpleNote('C#4')).toBe('#1');
    expect(SNTransition.General.noteNameToSimpleNote('C5')).toBe('1^');
    expect(SNTransition.General.noteNameToSimpleNote('C3')).toBe('1_');
    expect(SNTransition.General.noteNameToSimpleNote('D#4')).toBe('#2');
  });

  /**
   * 测试 noteNameToParsedNote 方法
   * 将音名转换为解析后的简谱对象。
   * @function noteNameToParsedNote
   */
  it('应该将音名转换为解析后的简谱对象', () => {
    expect(SNTransition.General.noteNameToParsedNote('C4')).toEqual({
      note: '1',
      octaveCount: 0,
      upDownCount: 0,
    });
    expect(SNTransition.General.noteNameToParsedNote('C#4')).toEqual({
      note: '1',
      octaveCount: 0,
      upDownCount: 1,
    });
    expect(SNTransition.General.noteNameToParsedNote('C5')).toEqual({
      note: '1',
      octaveCount: 1,
      upDownCount: 0,
    });
    expect(SNTransition.General.noteNameToParsedNote('D3')).toEqual({
      note: '2',
      octaveCount: -1,
      upDownCount: 0,
    });
    expect(SNTransition.General.noteNameToParsedNote('A#5')).toEqual({
      note: '6',
      octaveCount: 1,
      upDownCount: 1,
    });
  });

  /**
   * 测试 midiToParsedNote 方法
   * 将 MIDI 值转换为解析后的简谱对象。
   * @function midiToParsedNote
   */
  it('应该将 MIDI 值转换为解析后的简谱对象', () => {
    expect(SNTransition.General.midiToParsedNote(60)).toEqual({
      note: '1',
      octaveCount: 0,
      upDownCount: 0,
    }); // C4
    expect(SNTransition.General.midiToParsedNote(61)).toEqual({
      note: '1',
      octaveCount: 0,
      upDownCount: 1,
    }); // C#4
    expect(SNTransition.General.midiToParsedNote(72)).toEqual({
      note: '1',
      octaveCount: 1,
      upDownCount: 0,
    }); // C5
    expect(SNTransition.General.midiToParsedNote(50)).toEqual({
      note: '2',
      octaveCount: -1,
      upDownCount: 0,
    }); // F3
    expect(SNTransition.General.midiToParsedNote(58)).toEqual({
      note: '6',
      octaveCount: -1,
      upDownCount: 1,
    }); // A#3
  });

  /**
   * 测试 midiToSimpleNote 方法
   * 将 MIDI 值转换为 SimpleNotation 模板格式的音高字符串。
   * @function midiToSimpleNote
   */
  it('应该将 MIDI 值转换为 SimpleNotation 格式的音高字符串', () => {
    expect(SNTransition.General.midiToSimpleNote(60)).toBe('1'); // C4
    expect(SNTransition.General.midiToSimpleNote(61)).toBe('#1'); // C#4
    expect(SNTransition.General.midiToSimpleNote(72)).toBe('1^'); // C5
    expect(SNTransition.General.midiToSimpleNote(48)).toBe('1_'); // C3
    expect(SNTransition.General.midiToSimpleNote(55)).toBe('5_'); // G3
  });

  /**
   * 测试 getTransposeByKey 方法
   * 获取当前调式的移调半音数。
   * 应该返回正确调式的移调半音数，包括常用大调、包含其他信息的调式字符串以及无效输入。
   * @function getTransposeByKey
   */
  it('应该返回正确调式的移调半音数', () => {
    expect(SNTransition.General.getTransposeByKey('C')).toBe(0);
    expect(SNTransition.General.getTransposeByKey('G')).toBe(7);
    expect(SNTransition.General.getTransposeByKey('Am')).toBe(9);
    expect(SNTransition.General.getTransposeByKey(undefined)).toBe(0);
    expect(SNTransition.General.getTransposeByKey('InvalidKey')).toBe(0);
  });
});

/**
 * SNTransition.Guitar 模块测试
 * 该模块包含吉他相关转换方法的测试。
 * @module SNTransition.Guitar
 */
describe('SNTransition.Guitar 吉他相关方法测试', () => {
  /**
   * 测试 findAllPositionsForMidi 方法
   * 查找给定 MIDI 音高在吉他指板上的所有可能位置。
   * 应该查找给定 MIDI 音高在吉他指板上的所有可能位置，并处理超出吉他范围的音高。
   * @function findAllPositionsForMidi
   */
  it('应该查找给定 MIDI 音高在吉他指板上的所有可能位置', () => {
    expect(SNTransition.Guitar.findAllPositionsForMidi(60)).toEqual([
      { string: 5, fret: 15 },
      { string: 4, fret: 10 },
      { string: 3, fret: 5 },
      { string: 2, fret: 1 },
    ]);
    expect(SNTransition.Guitar.findAllPositionsForMidi(30)).toEqual([]);
    expect(SNTransition.Guitar.findAllPositionsForMidi(100)).toEqual([]);
  });

  /**
   * 测试 findPreferredPositionsForMidi 方法
   * 查找给定 MIDI 音高在 capo 移调后的优先品位区域内的位置。
   * 应该查找给定 MIDI 音高在 capo 移调后的优先品位区域内的位置，并处理不同优先品位范围和maxFret限制。
   * @function findPreferredPositionsForMidi
   */
  it('应该查找给定 MIDI 音高在 capo 移调后的优先品位区域内的位置', () => {
    expect(SNTransition.Guitar.findPreferredPositionsForMidi(52, 2)).toEqual([
      { string: 4, fret: 2 },
    ]);
    expect(SNTransition.Guitar.findPreferredPositionsForMidi(60, 0, 5)).toEqual(
      [
        { string: 3, fret: 5 },
        { string: 2, fret: 1 },
      ],
    );
    expect(
      SNTransition.Guitar.findPreferredPositionsForMidi(60, 0, 3, 2),
    ).toEqual([{ fret: 1, string: 2 }]);
    expect(SNTransition.Guitar.findPreferredPositionsForMidi(30, 0)).toEqual(
      [],
    );
    expect(SNTransition.Guitar.findPreferredPositionsForMidi(100, 0)).toEqual(
      [],
    );
  });

  /**
   * 测试 getChordFretPositions 方法
   * 获取吉他和弦符号对应的吉他指板品位。
   * @function getChordFretPositions
   */
  it('应该获取吉他和弦符号对应的吉他指板品位', () => {
    const cChord = SNTransition.Guitar.getChordFretPositions('C');
    expect(cChord).toEqual([null, 3, 2, 0, 1, 0]);
    const amChord = SNTransition.Guitar.getChordFretPositions('Am');
    expect(amChord).toEqual([null, 0, 2, 2, 1, 0]);
    expect(
      SNTransition.Guitar.getChordFretPositions('InvalidChord'),
    ).toBeUndefined();
  });

  /**
   * 测试 fretPositionsToNoteNames 方法
   * 将吉他品位和弦号转换为音高数组。
   * @function fretPositionsToNoteNames
   */
  it('应该将吉他品位和弦号转换为音高数组', () => {
    const cChordFrets = [null, 3, 2, 0, 1, 0];
    const expectedCChordNotes = ['C3', 'E3', 'G3', 'C4', 'E4'];
    expect(SNTransition.Guitar.fretPositionsToNoteNames(cChordFrets)).toEqual(
      expectedCChordNotes,
    );
    const emChordFrets = [0, 2, 2, 0, 0, 0];
    const expectedEmChordNotes = ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'];
    expect(SNTransition.Guitar.fretPositionsToNoteNames(emChordFrets)).toEqual(
      expectedEmChordNotes,
    );
    const mutedStrings = [null, null, null, null, null, null];
    expect(SNTransition.Guitar.fretPositionsToNoteNames(mutedStrings)).toEqual(
      [],
    );
  });

  /**
   * 测试 getSimpleNoteGuitarPosition 方法
   * 获取简谱音符在吉他流行谱上显示的位置和数字。
   * @function getSimpleNoteGuitarPosition
   */
  it('应该获取简谱音符在吉他上的最佳位置', () => {
    expect(SNTransition.Guitar.getSimpleNoteGuitarPosition('1', 0, 0)).toEqual({
      string: 5,
      fret: 3,
    });
    expect(SNTransition.Guitar.getSimpleNoteGuitarPosition('1', 1, 0)).toEqual({
      string: 2,
      fret: 1,
    });
    expect(SNTransition.Guitar.getSimpleNoteGuitarPosition('5', -1, 0)).toEqual(
      {
        string: 6,
        fret: 3,
      },
    );
    expect(SNTransition.Guitar.getSimpleNoteGuitarPosition('1', 0, 1)).toEqual({
      string: 6,
      fret: 9,
    });
    expect(SNTransition.Guitar.getSimpleNoteGuitarPosition('0', 0, 0)).toEqual({
      string: null,
      fret: null,
    });
  });
});
