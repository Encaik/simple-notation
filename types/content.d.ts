import { SNBox } from './box';
import { SNInfo } from './info';
import { SNInfoOptions, SNContentOptions, SNScoreOptions, SNInfoContextOptions } from './model';
import { SNScore } from './score';
export declare class SNContent extends SNBox {
    el: SVGGElement;
    info: SNInfo | undefined;
    score: SNScore | undefined;
    constructor(svg: SVGElement, options?: SNContentOptions);
    createSvg(parentEl: SVGElement): SVGGElement;
    initInfo(options?: SNInfoOptions): void;
    drawInfo(options: SNInfoContextOptions): void;
    initScore(options?: SNScoreOptions): void;
    drawScore(scoreData: string[]): void;
}
