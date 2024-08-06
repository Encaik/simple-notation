import { SNData, SNDataInfo } from '@types';
export declare class SNRuntime {
    static info: SNDataInfo;
    static score: string[];
    static lyric: string[] | undefined;
    constructor(data: SNData);
}
