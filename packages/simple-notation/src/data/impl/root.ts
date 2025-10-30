import { SNParserNode, SNParserRootNode } from '../model/parser.ts';
import { SNParserBase } from './base.ts';

export class SNParserRoot extends SNParserBase implements SNParserRootNode {
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'root' });
  }
}
