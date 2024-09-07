import { SNBox } from '@core';
import { SNMeasure } from './measure';
import { SNMeasureOptions, SNStaveOptions } from '@types';
import { SNScore } from './score';
export declare class SNStave extends SNBox {
    el: SVGGElement;
    index: number;
    weight: number;
    measureOptions: SNMeasureOptions[];
    measures: SNMeasure[];
    y: number;
    endLine: boolean;
    width: number;
    constructor(score: SNScore, options: SNStaveOptions);
    drawMeasureEndLine(): void;
    drawMeasureLine(measure: SNMeasure): void;
    draw(): void;
}
