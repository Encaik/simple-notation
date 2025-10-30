import { SNChordType } from '@data/model';
import { SNParserNode } from '@data/node';

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
