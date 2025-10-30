import { SNMeasureMeta } from '../model/parser.ts';
import { SNParserNode } from './base.ts';

export class SNParserMeasure extends SNParserNode<SNMeasureMeta> {
  index: number;

  constructor({
    id,
    index,
    originStr,
  }: Pick<SNParserNode, 'id' | 'originStr'> & { index: number }) {
    super({ id, originStr, type: 'measure' });
    this.index = index;
  }
}
