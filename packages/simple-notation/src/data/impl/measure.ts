import { SNMeasureMeta, SNParserMeasureNode } from '../model/parser.ts';
import { SNParserBase } from './base.ts';

export class SNParserMeasure
  extends SNParserBase<SNMeasureMeta>
  implements SNParserMeasureNode
{
  index: number;

  constructor({
    id,
    index,
    originStr,
  }: Pick<SNParserMeasureNode, 'id' | 'originStr' | 'index'>) {
    super({ id, originStr, type: 'measure' });
    this.index = index;
  }
}
