import { SNBox } from './box';
import { SNMeasure } from './measure';
import { SNNoteOptions } from './model';
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
    noteData: string;
    index: number;
    startNote: boolean;
    endNote: boolean;
    underlineCount: number;
    constructor(measure: SNMeasure, options: SNNoteOptions);
    drawUnderLine(times: number): void;
    draw(): void;
}
