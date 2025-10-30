import { SNParserNode } from '@data/node';

export class SNParserRoot extends SNParserNode {
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'root' });
  }
}
