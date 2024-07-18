import { SNInfoContextOptions, SNInfoOptions } from './model';
import { SNContent } from './content';
import { SNBox } from './box';
export declare class SNInfo extends SNBox {
    el: SVGGElement;
    title: string;
    composer: string;
    titleEl: SVGTextElement | undefined;
    composerEl: SVGTextElement | undefined;
    constructor(content: SNContent, options?: SNInfoOptions);
    createSvg(parentEl: SVGGElement): SVGGElement;
    drawTitle(title: string): SVGTextElement;
    drawComposer(composer: string): SVGTextElement;
    draw(options?: SNInfoContextOptions): void;
}
