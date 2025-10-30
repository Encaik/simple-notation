import { SNParserMeta } from '../model/parser.ts';
import { SNParserNode } from './base.ts';

export class SNParserScore extends SNParserNode<SNParserMeta> {
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'score' });
  }
}
