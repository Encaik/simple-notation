import { SNPitch } from '../../core/model/base.ts';
import { SNParserNode } from './base.ts';
import { SNParserChord } from './chord.ts';

export class SNParserNote extends SNParserNode {
  pitch: SNPitch;
  articulation?: 'staccato' | 'legato' | 'tenuto';
  chords?: SNParserChord;

  constructor({
    id,
    originStr,
    pitch,
    duration,
  }: Required<
    Pick<SNParserNode, 'id' | 'originStr' | 'duration'> & { pitch: SNPitch }
  >) {
    super({ id, originStr, type: 'note' });
    this.pitch = pitch;
    this.duration = duration;
  }
}
