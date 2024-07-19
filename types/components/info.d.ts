import { SNDataInfo, SNInfoOptions } from '@types';
import { SNContent } from './content';
import { SNBox } from '@core';
export declare class SNInfo extends SNBox {
    el: SVGGElement;
    title: string;
    composer: string;
    titleEl: SVGTextElement | undefined;
    composerEl: SVGTextElement | undefined;
    constructor(content: SNContent, options?: SNInfoOptions);
    drawTitle(title: string): SVGTextElement;
    drawComposer(composer: string): SVGTextElement;
    drawLyricst(): SVGTextElement;
    drawTime(): SVGTextElement;
    drawKey(): SVGTextElement;
    drawTempo(): SVGTextElement;
    draw(options?: SNDataInfo): void;
}
