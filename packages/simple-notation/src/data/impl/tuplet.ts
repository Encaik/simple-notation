import {
  SNParserMeasure,
  SNParserNote,
  SNParserTupletNode,
  SNParserNodeType,
} from '../model/parser.ts';
import { SNDuration } from '../../core/model/base.ts';

export class SNParserTuplet implements SNParserTupletNode {
  id: string;
  type: SNParserNodeType = 'tuplet';
  parent?: SNParserMeasure;
  children?: SNParserNote[];
  originStr: string;
  count: number;
  duration: SNDuration;

  constructor({ id, originStr }: Pick<SNParserTupletNode, 'id' | 'originStr'>) {
    this.id = id;
    this.originStr = originStr;
    this.count = 0;
    this.duration = 0;
  }

  addChildren(children: SNParserNote | SNParserNote[]): SNParserTuplet {
    if (!this.children) this.children = [];
    if (Array.isArray(children)) {
      children.forEach((child) => {
        child.parent = this;
        this.children?.push(child);
      });
    } else {
      children.parent = this;
      this.children?.push(children);
    }
    this.count = this.children?.length ?? 0;
    this.duration = (this.children?.[0].duration || 0) * (this.count - 1);
    return this;
  }

  setCount(count: number): SNParserTuplet {
    this.count = count;
    return this;
  }

  setDuration(duration: SNDuration): SNParserTuplet {
    this.duration = duration;
    return this;
  }
}
