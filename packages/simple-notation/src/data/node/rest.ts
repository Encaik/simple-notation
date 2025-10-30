import { SNParserNode } from '@data/node';

export class SNParserRest extends SNParserNode {
  constructor({
    id,
    originStr,
    duration,
  }: Pick<SNParserNode, 'id' | 'originStr' | 'duration'>) {
    super({ id, originStr, type: 'rest' });
    this.duration = duration;
  }
}
