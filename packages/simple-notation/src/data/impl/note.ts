import { SNParserChordNode, SNParserNoteNode } from '../model/parser.ts';
import { SNPitch } from '../../core/model/base.ts';
import { SNParserBase } from './base.ts';

export class SNParserNote extends SNParserBase implements SNParserNoteNode {
  pitch: SNPitch;
  articulation?: 'staccato' | 'legato' | 'tenuto';
  chords?: SNParserChordNode;

  constructor({
    id,
    originStr,
    pitch,
    duration,
  }: Required<
    Pick<SNParserNoteNode, 'id' | 'originStr' | 'pitch' | 'duration'>
  >) {
    super({ id, originStr, type: 'note' });
    this.pitch = pitch;
    this.duration = duration;
  }
}
