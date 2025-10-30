import { SNVoiceMeta } from '../model/parser.ts';
import { SNParserNode } from './base.ts';

export class SNParserVoice extends SNParserNode<SNVoiceMeta> {
  instrument?: string; // 乐器类型（如 "piano"、"violin"）
  isPrimary?: boolean; // 是否为主声部（渲染优先级）

  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'voice' });
  }
}
