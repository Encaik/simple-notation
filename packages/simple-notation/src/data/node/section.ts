import { SNParserMeta } from '@data/model';
import { SNParserNode } from '@data/node';

export class SNParserSection extends SNParserNode<SNParserMeta> {
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'section' });
  }
}
