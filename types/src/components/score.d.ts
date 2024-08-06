import { SNBox } from '@core';
import { SNContent } from './content';
import { SNScoreOptions } from '@types';
import { SNStave } from './stave';
export declare class SNScore extends SNBox {
    el: SVGGElement;
    stavesData: string[];
    staves: SNStave[];
    lineHeight: number;
    lineSpace: number;
    totalMeasures: number;
    totalNotes: number;
    constructor(content: SNContent, options: SNScoreOptions);
    draw(scoreData: string[]): void;
}
