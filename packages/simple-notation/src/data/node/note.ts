import { SNPitch } from '@core/model';
import { SNParserNode, SNParserChord } from '@data/node';

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
