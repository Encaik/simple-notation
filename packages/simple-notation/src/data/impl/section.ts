import { SNParserMeta } from '../model/parser.ts';
import { SNParserNode } from './base.ts';

export class SNParserSection extends SNParserNode<SNParserMeta> {
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'section' });
  }
}
