import { SNBox } from '@core';
import { SNMeasure } from './measure';
import { SNPoint, SNStaveOptions } from '@types';
import { SNScore } from './score';
export declare class SNStave extends SNBox {
    el: SVGGElement;
    measureData: string[];
    measures: SNMeasure[];
    index: number;
    totalMeasures: number;
    totalNotes: number;
    staveNotes: number;
    constructor(score: SNScore, options: SNStaveOptions);
    addLine(start: SNPoint, end: SNPoint): void;
    draw(): void;
}
