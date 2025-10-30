import { SNParserLyricNode } from '../model/parser.ts';
import { SNParserBase } from './base.ts';

export class SNParserLyric extends SNParserBase implements SNParserLyricNode {
  noteId: string;
  syllable: string;

  constructor({ id, originStr, noteId, syllable }: SNParserLyricNode) {
    super({ id, originStr, type: 'lyric' });
    this.noteId = noteId;
    this.syllable = syllable;
  }
}
