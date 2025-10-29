import { BaseParser } from './parser/base-parser';
import { SNParserInputType, SNDataType } from './model/input';
import { SNParserResult } from './model/parser';
import { AbcParser } from './parser/abc-parser';

export class DataManager {
  private cache = new Map<string, SNParserInputType>();

  constructor() {}

  // 核心方法：处理原始数据并返回ScoreTree
  processData(data: SNParserInputType, type: SNDataType): SNParserResult {
    // 1. 生成缓存key（避免重复解析）
    // const cacheKey = this.generateCacheKey(data);
    // if (this.cache.has(cacheKey)) {
    //   Logger.debug(`使用缓存数据: ${cacheKey}`);
    //   return this.cache.get(cacheKey)!;
    // }

    // 2. 根据数据类型选择解析器
    const parser = this.getParser(type);

    // 3. 解析数据（支持异步解析，如复杂乐谱）
    const parsedResult = this.parseWithParser(parser, data);

    // 4. 缓存并返回结果
    // this.cache.set(cacheKey, parsedResult);
    return parsedResult;
  }

  // 选择解析器
  private getParser(type: SNDataType): BaseParser<SNParserInputType> {
    switch (type) {
      case SNDataType.ABC:
        return new AbcParser();
      // case SNDataType.TEMPLATE:
      //   return new TemplateParser();
      default:
        throw new Error(`不支持的数据类型: ${type}`);
    }
  }

  // 执行解析
  private parseWithParser(
    parser: BaseParser<SNParserInputType>,
    data: SNParserInputType,
  ): SNParserResult {
    const parseResult = parser.parse(data);
    return {
      data: parseResult,
    };
  }

  // 工具方法：生成缓存key（基于数据内容和配置）
  // private generateCacheKey(data: SNData): string {
  //   return btoa(JSON.stringify(data));
  // }

  // 清除缓存（可选）
  clearCache(): void {
    this.cache.clear();
  }
}
