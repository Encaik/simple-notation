import { SNParserNode } from './base.ts';

export class SNParserTie extends SNParserNode {
  style: 'slur' | 'tie' | 'phrase';

  constructor({
    id,
    originStr,
    style,
  }: Pick<SNParserNode, 'id' | 'originStr'> & {
    style: 'slur' | 'tie' | 'phrase';
  }) {
    super({ id, originStr, type: 'tie' });
    this.style = style;
  }
}
