import { SNParserRestNode } from '../model/parser.ts';
import { SNParserBase } from './base.ts';

export class SNParserRest extends SNParserBase implements SNParserRestNode {
  constructor({
    id,
    originStr,
    duration,
  }: Pick<SNParserRestNode, 'id' | 'originStr' | 'duration'>) {
    super({ id, originStr, type: 'rest' });
    this.duration = duration;
  }
}
