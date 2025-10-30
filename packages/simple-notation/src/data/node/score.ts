import { SNParserMeta } from '@data/model';
import { SNParserNode } from '@data/node';

export class SNParserScore extends SNParserNode<SNParserMeta> {
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'score' });
  }
}
