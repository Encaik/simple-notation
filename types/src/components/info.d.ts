import { SNDataInfo, SNInfoOptions } from '@types';
import { SNContent } from './content';
import { SNBox } from '@core';
export declare class SNInfo extends SNBox {
    el: SVGGElement;
    constructor(content: SNContent, options: SNInfoOptions);
    drawTitle(title: string): SVGTextElement | undefined;
    drawComposer(composer?: string): SVGTextElement | undefined;
    drawLyricst(lyricist?: string): SVGTextElement | undefined;
    drawSignure(beat?: string, time?: string): SVGTextElement | undefined;
    drawKey(key?: string): SVGTextElement | undefined;
    drawTempo(tempo?: string): SVGTextElement | undefined;
    draw(options?: SNDataInfo): void;
}
