import { SNParserNode } from '@data/node';

/**
 * 根（Root）节点
 *
 * 解析器树的根节点，表示整个解析结果。
 * 通常包含文件级别的元数据（如 ABC 格式的文件头信息）和多个乐谱（Score）节点。
 *
 * 设计说明：
 * - Root 节点是解析器树的顶层节点
 * - 可以包含多个 Score 子节点（一个文件可能包含多首乐曲）
 * - meta 中存储文件级别的元数据（如 ABC 格式的 %% 指令）
 */
export class SNParserRoot extends SNParserNode {
  /**
   * 创建根节点
   *
   * @param id 节点唯一标识符
   * @param originStr 原始字符串（用于调试和追溯）
   */
  constructor({ id, originStr }: Pick<SNParserNode, 'id' | 'originStr'>) {
    super({ id, originStr, type: 'root' });
  }
}
