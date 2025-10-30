import {
  SNParserNode,
  SNParserMeta,
  SNParserSectionNode,
} from '../model/parser.ts';
import { SNParserBase } from './base.ts';

export class SNParserSection
  extends SNParserBase<SNParserMeta>
  implements SNParserSectionNode
{
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'section' });
  }
}
