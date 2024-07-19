import { SNBox } from './box';
import { SNInfo } from './info';
import { SNInfoOptions, SNContentOptions, SNScoreOptions, SNDataInfo } from './model';
import { SNScore } from './score';
export declare class SNContent extends SNBox {
    el: SVGGElement;
    info: SNInfo | undefined;
    score: SNScore | undefined;
    constructor(svg: SVGElement, options?: SNContentOptions);
    initInfo(options?: SNInfoOptions): void;
    drawInfo(options: SNDataInfo): void;
    initScore(options?: SNScoreOptions): void;
    drawScore(scoreData: string[]): void;
}
