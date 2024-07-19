export interface SNData {
  info: SNDataInfo;
  score: string[];
}

export interface SNDataInfo {
  title: string;
  composer?: string;
}

export interface SNPoint {
  x: number;
  y: number;
}
