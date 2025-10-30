import { SNParserTieNode } from '../model/parser.ts';
import { SNParserBase } from './base.ts';

export class SNParserTie extends SNParserBase implements SNParserTieNode {
  style: 'slur' | 'tie' | 'phrase';

  constructor({
    id,
    originStr,
    style,
  }: Pick<SNParserTieNode, 'id' | 'originStr' | 'style'>) {
    super({ id, originStr, type: 'tie' });
    this.style = style;
  }
}
