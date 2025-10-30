import { SNParserNode } from './base.ts';
import { SNParserNote } from './note.ts';

export class SNParserTuplet extends SNParserNode {
  count: number;

  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'tuplet' });
    this.count = 0;
  }

  addChildren(children: SNParserNode | SNParserNote[]): this {
    super.addChildren(children);
    this.count = this.children?.length ?? 0;
    this.duration = (this.children?.[0].duration || 0) * (this.count - 1);
    return this;
  }
}
