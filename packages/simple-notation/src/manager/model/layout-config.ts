import { SNLayoutMargin, SNLayoutPadding } from '@layout/model';

export interface SNLayoutConfig {
  container: SNLayoutContainerConfig;
  page: SNLayoutPageConfig;
  line: SNLayoutLineConfig;
}

export interface SNLayoutContainerConfig {
  width: number;
  height: number;
  backgroundColor: string;
}

export interface SNLayoutPageConfig {
  enable: boolean;
  margin: SNLayoutMargin;
  padding: SNLayoutPadding;
  pageSize: SNLayoutPageSizeConfig;
  pageNumber: SNLayoutPageNumberConfig;
}

export interface SNLayoutPageSizeConfig {
  width: number;
  height: number;
}

export interface SNLayoutPageNumberConfig {
  enable: boolean;
  position: 'top' | 'bottom';
  style: string;
}

export interface SNLayoutLineConfig {
  height: number;
  spacing: number;
}
