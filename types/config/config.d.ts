import { SNContentOptions, SNDebugOptions, SNInfoOptions, SNOptions, SNScoreOptions } from '@types';
export declare class SNConfig {
    static width: number;
    static height: number;
    static content: SNContentOptions;
    static info: SNInfoOptions;
    static score: SNScoreOptions;
    static debug: SNDebugOptions;
    constructor(container: HTMLDivElement, options?: SNOptions);
}
