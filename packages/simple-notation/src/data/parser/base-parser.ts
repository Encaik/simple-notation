import { SNParserInputType } from '../model/input';
import {
  SNParserMeasure,
  SNParserElement,
  SNParserScore,
  SNParserRoot,
  SNParserSection,
  SNParserVoice,
} from '../model/parser';

/**
 * 抽象解析器基类，定义乐谱解析的核心方法接口
 * @abstract
 */
export abstract class BaseParser<T extends SNParserInputType> {
  abstract parse(data: T): SNParserRoot;

  abstract parseRoot(scoreCollectionData: string): SNParserRoot;

  abstract parseScore(scoreData: string): SNParserScore;

  abstract parseSection(sectionData: string): SNParserSection;

  abstract parseVoice(voiceData: string): SNParserVoice;

  abstract parseMeasure(measureData: string, index: number): SNParserMeasure;

  abstract parseElement(elementData: string): SNParserElement;
}
