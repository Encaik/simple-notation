import { SNBox } from '@core';
import { SNMeasureOptions } from '@types';
import { SNNote } from './note';
import { SNStave } from './stave';
export declare class SNMeasure extends SNBox {
    el: SVGGElement;
    notesData: string[];
    notes: SNNote[];
    index: number;
    totalNotes: number;
    constructor(stave: SNStave, options: SNMeasureOptions);
    drawCount(): void;
    draw(): void;
}
