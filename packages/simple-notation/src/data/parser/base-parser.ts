import { SNParserInputType } from '../model/input';
import {
  SNMeasure,
  SNMeasureElement,
  SNScore,
  SNScoreCollection,
  SNSection,
  SNVoice,
} from '../model/parser';

/**
 * 抽象解析器基类，定义乐谱解析的核心方法接口
 * @abstract
 */
export abstract class BaseParser<T extends SNParserInputType> {
  abstract parse(data: T): SNScoreCollection;

  abstract parseScoreCollection(scoreCollectionData: string): SNScoreCollection;

  abstract parseScore(scoreData: string): SNScore;

  abstract parseSection(sectionData: string): SNSection;

  abstract parseVoice(voiceData: string): SNVoice;

  abstract parseMeasure(measureData: string): SNMeasure;

  abstract parseElement(elementData: string): SNMeasureElement;
}
