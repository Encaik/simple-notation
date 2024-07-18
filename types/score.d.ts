import { SNBox } from './box';
import { SNContent } from './content';
import { SNScoreOptions } from './model';
import { SNStave } from './stave';
export declare class SNScore extends SNBox {
    el: SVGGElement;
    stavesData: string[];
    staves: SNStave[];
    lineHeight: number;
    lineSpace: number;
    totalMeasures: number;
    totalNotes: number;
    constructor(content: SNContent, options?: SNScoreOptions);
    createSvg(parentEl: SVGGElement): SVGGElement;
    draw(scoreData: string[]): void;
}
