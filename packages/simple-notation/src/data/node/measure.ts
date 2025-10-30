import { SNMeasureMeta } from '@data/model';
import { SNParserNode } from '@data/node';

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
