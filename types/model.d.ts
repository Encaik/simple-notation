export interface SNOptions {
    width?: number;
    height?: number;
    info?: SNInfoOptions;
    content?: SNContentOptions;
    text?: SNTextOptions;
    score?: SNScoreOptions;
}
export interface SNData {
    info: SNDataInfo;
    score: string[];
}
export interface SNDataInfo {
    title: string;
    composer?: string;
}
export type SNInfoOptions = {
    height: number;
    padding: number;
} & SNDataInfo;
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
    x: number;
    y: number;
    text: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    stroke?: string;
    strokeWidth?: number;
    textAnchor?: string;
}
export interface SNGOptions {
    tag: string;
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
    startNote: boolean;
    endNote: boolean;
    underlineCount: number;
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
