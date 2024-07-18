export interface SNOptions {
    width: number;
    height: number;
    info?: SNInfoOptions;
    content?: SNContentOptions;
    text?: SNTextOptions;
    score?: SNScoreOptions;
}
export interface SNInfoContextOptions {
    title: string;
    composer?: string;
}
export type SNInfoOptions = {
    height: number;
    padding: number;
} & SNInfoContextOptions;
export interface SNContentOptions {
    padding: number;
    infoShow: boolean;
}
export interface SNScoreOptions {
    padding: number;
    lineHeight: number;
    lineSpace: number;
}
export interface SNTextOptions {
    fontSize: number;
    fontFamily: string;
}
export interface SNStaveOptions {
    index: number;
    currentStave: number;
    y: number;
    height: number;
    context: string;
    text?: SNTextOptions;
}
export interface SNMeasureOptions {
    index: number;
    currentMeasure: number;
    x: number;
    width: number;
    context: string;
    text?: SNTextOptions;
}
export interface SNNoteOptions {
    index: number;
    currentNote: number;
    x: number;
    width: number;
    context: string;
    text?: SNTextOptions;
}
export interface SNBoxOptions {
    inner?: boolean;
    outer?: boolean;
    innerColor?: string;
    innerLineWidth?: number;
    outerColor?: string;
    outerLineWidth?: number;
}
export interface SNPoint {
    x: number;
    y: number;
}
