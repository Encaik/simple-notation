import { SNContent } from './content';
import { SNData, SNOptions } from './model';
export declare class SimpleNotation {
    container: HTMLDivElement;
    el: SVGElement;
    options: SNOptions;
    content: SNContent;
    constructor(container: HTMLDivElement, options?: SNOptions);
    loadData(data: SNData): void;
    detailOptions(options?: SNOptions): void;
}
