import { SNParserChordNode } from '../model/parser.ts';
import { SNParserBase } from './base.ts';

export class SNParserChord extends SNParserBase implements SNParserChordNode {
  key: string;
  chordType: SNParserChordNode['chordType'];

  constructor({ id, originStr, key, chordType }: SNParserChordNode) {
    super({ id, originStr, type: 'chord' });
    this.key = key;
    this.chordType = chordType;
  }
}
