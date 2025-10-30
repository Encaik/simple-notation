import { SNParserNode } from './base.ts';

export class SNParserLyric extends SNParserNode {
  noteId: string;
  syllable: string;

  constructor({
    id,
    originStr,
    noteId,
    syllable,
  }: Pick<SNParserNode, 'id' | 'originStr'> & {
    noteId: string;
    syllable: string;
  }) {
    super({ id, originStr, type: 'lyric' });
    this.noteId = noteId;
    this.syllable = syllable;
  }
}
