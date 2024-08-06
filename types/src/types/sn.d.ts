/**
 * 用来渲染内容的内容传参
 */
export interface SNData {
    info: SNDataInfo;
    score: string[];
    lyric?: string[];
}
export interface SNDataInfo {
    title: string;
    composer?: string;
    lyricist?: string;
    beat?: string;
    time?: string;
    key?: string;
    tempo?: string;
}
