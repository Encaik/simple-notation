import { SNParserInputType } from '../model/input';
import {
  SNParserMeasure,
  SNParserElement,
  SNParserScore,
  SNParserRoot,
  SNParserSection,
  SNParserVoice,
  SNParserNode,
} from '../model/parser';

/**
 * 抽象解析器基类，定义乐谱解析的核心方法接口
 * @abstract
 */
export abstract class BaseParser<T extends SNParserInputType> {
  abstract parse(data: T): SNParserRoot;

  abstract parseRoot(scoreCollectionData: string): SNParserRoot;

  abstract parseScore(parent:SNParserRoot, scoreData: string): SNParserScore;

  abstract parseSection(parent:SNParserScore, sectionData: string): SNParserSection;

  abstract parseVoice(parent:SNParserSection, voiceData: string): SNParserVoice;

  abstract parseMeasure(parent:SNParserVoice, measureData: string, index: number): SNParserMeasure;

  abstract parseElement(parent:SNParserNode, elementData: string): SNParserElement;
}
