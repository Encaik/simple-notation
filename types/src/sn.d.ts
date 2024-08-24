import { SNContent } from '@components';
import { SNData, SNOptions } from '@types';
export declare class SimpleNotation {
    el: SVGElement;
    content: SNContent;
    constructor(container: HTMLDivElement, options?: SNOptions);
    /**
     * 加载简谱数据并绘制
     * @param data
     */
    loadData(data: SNData): void;
    resize(width: number, height: number): void;
}
