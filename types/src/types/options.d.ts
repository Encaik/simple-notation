/**
 * class初始化时需要的配置项
 */
export interface SNOptions {
    width?: number;
    height?: number;
    content?: SNContentOptions;
    info?: SNInfoOptions;
    score?: SNScoreOptions;
    debug?: boolean;
}
export type SNInfoOptions = {
    height: number;
    padding: number;
};
export interface SNContentOptions {
    padding: number;
    infoShow: boolean;
}
export interface SNScoreOptions {
    padding: number;
    lineHeight: number;
    lineSpace: number;
    lyricHeight: number;
}
export interface SNStaveOptions {
    index: number;
    currentStave: number;
    y: number;
    context: string;
}
export interface SNMeasureOptions {
    index: number;
    currentMeasure: number;
    x: number;
    width: number;
    context: string;
}
export interface SNNoteOptions {
    index: number;
    currentNote: number;
    x: number;
    width: number;
    context: string;
    startNote: boolean;
    endNote: boolean;
    underlineCount: number;
}
export interface SNBorderBoxOptions {
    inner?: boolean;
    outer?: boolean;
    innerColor?: string;
    innerLineWidth?: number;
    outerColor?: string;
    outerLineWidth?: number;
}
export interface SNDebugOptions {
    borderbox?: {
        content?: SNBorderBoxOptions;
        info?: SNBorderBoxOptions;
        score?: SNBorderBoxOptions;
        stave?: SNBorderBoxOptions;
        measure?: SNBorderBoxOptions;
        note?: SNBorderBoxOptions;
    };
}
