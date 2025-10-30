import { SNParserNode } from './base.ts';

export class SNParserRoot extends SNParserNode {
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'root' });
  }
}
