import { SNAbcInput } from '../model/input';
import {
  SNScoreCollection,
  SNScore,
  SNSection,
  SNVoice,
  SNMeasure,
  SNMeasureElement,
} from '../model/parser';
import { BaseParser } from './base-parser';

export class AbcParser extends BaseParser<SNAbcInput> {
  parse(data: string): SNScoreCollection {
    throw new Error('Method not implemented.');
  }
  parseScoreCollection(scoreCollectionData: string): SNScoreCollection {
    throw new Error('Method not implemented.');
  }
  parseScore(scoreData: string): SNScore {
    throw new Error('Method not implemented.');
  }
  parseSection(sectionData: string): SNSection {
    throw new Error('Method not implemented.');
  }
  parseVoice(voiceData: string): SNVoice {
    throw new Error('Method not implemented.');
  }
  parseMeasure(measureData: string): SNMeasure {
    throw new Error('Method not implemented.');
  }
  parseElement(elementData: string): SNMeasureElement {
    throw new Error('Method not implemented.');
  }
}
