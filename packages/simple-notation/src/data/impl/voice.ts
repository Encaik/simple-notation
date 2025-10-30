import {
  SNParserNode,
  SNVoiceMeta,
  SNParserVoiceNode,
} from '../model/parser.ts';
import { SNParserBase } from './base.ts';

export class SNParserVoice
  extends SNParserBase<SNVoiceMeta>
  implements SNParserVoiceNode
{
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'voice' });
  }
}
