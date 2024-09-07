import { SNBox } from '@core';
import { SNMeasure } from './measure';
import { SNNoteOptions } from '@types';
/**
 * 1 四分音符
 * 1/8 八分音符
 * 1/16 十六分音符
 * 1/32 三十二分音符
 * 1/2 二分音符
 * 1/0 全音符
 */
export declare class SNNote extends SNBox {
    el: SVGGElement;
    index: number;
    noteData: string;
    weight: number;
    note: string;
    startNote: boolean;
    endNote: boolean;
    underlineCount: number;
    x: number;
    width: number;
    constructor(measure: SNMeasure, options: SNNoteOptions);
    drawUnderLine(times: number): void;
    draw(): void;
}
