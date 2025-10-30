import { SNChordType } from '../model/parser.ts';
import { SNParserNode } from './base.ts';

export class SNParserChord extends SNParserNode {
  key: string;
  chordType: SNChordType;

  constructor({
    id,
    originStr,
    key,
    chordType,
  }: Pick<SNParserNode, 'id' | 'originStr'> & {
    key: string;
    chordType: SNChordType;
  }) {
    super({ id, originStr, type: 'chord' });
    this.key = key;
    this.chordType = chordType;
  }
}
