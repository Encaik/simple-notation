import { SNBox } from './box';
import { SNMeasure } from './measure';
import { SNNoteOptions } from './model';
export declare class SNNote extends SNBox {
    el: SVGGElement;
    noteData: string;
    constructor(measure: SNMeasure, options: SNNoteOptions);
    createSvg(parentEl: SVGGElement): SVGGElement;
    draw(): void;
}
