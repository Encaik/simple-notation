import { SNContent } from '@components';
import { SNData, SNOptions } from '@types';
export declare class SimpleNotation {
    container: HTMLDivElement;
    el: SVGElement;
    options: SNOptions;
    content: SNContent;
    constructor(container: HTMLDivElement, options?: SNOptions);
    loadData(data: SNData): void;
    detailOptions(options?: SNOptions): void;
}
