import {
  SNParserMeta,
  SNParserNode,
  SNParserScoreNode,
} from '../model/parser.ts';
import { SNParserBase } from './base.ts';

export class SNParserScore
  extends SNParserBase<SNParserMeta>
  implements SNParserScoreNode
{
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'score' });
  }
}
