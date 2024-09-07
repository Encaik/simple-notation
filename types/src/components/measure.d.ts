import { SNBox } from '@core';
import { SNMeasureOptions, SNNoteOptions } from '@types';
import { SNNote } from './note';
import { SNStave } from './stave';
export declare class SNMeasure extends SNBox {
    el: SVGGElement;
    index: number;
    measureData: string;
    weight: number;
    noteOptions: SNNoteOptions[];
    notes: SNNote[];
    x: number;
    width: number;
    constructor(stave: SNStave, options: SNMeasureOptions);
    drawCount(): void;
    draw(): void;
}
