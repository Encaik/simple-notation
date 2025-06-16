import { SNDataType } from 'simple-notation';
import type { Example } from '../model';

export const examples: Example[] = [
  {
    name: '小星星',
    hasConf: true,
    type: SNDataType.TEMPLATE,
    isFinished: true,
  },
  {
    name: '清明雨上',
    hasConf: true,
    type: SNDataType.TEMPLATE,
    isFinished: true,
  },
  {
    name: '曾经的你',
    hasConf: true,
    type: SNDataType.TEMPLATE,
    isFinished: true,
  },
  {
    name: '天下',
    hasConf: false,
    type: SNDataType.TEMPLATE,
    isFinished: false,
  },
  {
    name: '平凡之路',
    hasConf: false,
    type: SNDataType.TEMPLATE,
    isFinished: true,
  },
  {
    name: '功能测试',
    hasConf: true,
    type: SNDataType.TEMPLATE,
    isFinished: false,
  },
  {
    name: "Cooley's",
    hasConf: false,
    type: SNDataType.ABC,
    isFinished: true,
  },
  // 可以添加更多示例
];
