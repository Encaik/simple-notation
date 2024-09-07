import { SNBox } from '@core';
import { SNContent } from './content';
import { SNNoteOptions, SNScoreOptions, SNStaveOptions } from '@types';
import { SNStave } from './stave';
export declare class SNScore extends SNBox {
    el: SVGGElement;
    staveOptions: SNStaveOptions[];
    staves: SNStave[];
    noteCount: number;
    constructor(content: SNContent, options: SNScoreOptions);
    parseNote(noteData: string): {
        weight: number;
        nodeTime: number;
        note: string;
        underlineCount: number;
    };
    parseMeasure(measureData: string, noteCount: number): {
        weight: number;
        measureNoteCount: number;
        noteOptions: SNNoteOptions[];
    };
    parseScore(scoreData: string): void;
    draw(scoreData: string): void;
}
