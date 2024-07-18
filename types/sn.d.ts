import { SNContent } from './content';
import { SNOptions } from './model';
export declare class SimpleNotation {
    container: HTMLDivElement;
    el: SVGElement | undefined;
    options: SNOptions;
    content: SNContent | undefined;
    constructor(container: HTMLDivElement, options?: SNOptions);
    detailOptions(options: Partial<SNOptions>): void;
    createSvg(): SVGSVGElement;
}
