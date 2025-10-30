import { SNLayoutConfig, SNScoreConfig } from '@manager/model';

export class ConfigManager {
  layoutConfig: SNLayoutConfig;
  scoreConfig: SNScoreConfig;

  constructor(layoutConfig?: SNLayoutConfig, scoreConfig?: SNScoreConfig) {
    this.layoutConfig = this.buildLayoutConfig(layoutConfig);
    this.scoreConfig = this.buildScoreConfig(scoreConfig);
  }

  buildLayoutConfig(layoutConfig?: SNLayoutConfig): SNLayoutConfig {
    return {
      container: {
        ...layoutConfig?.container,
        width: 800,
        height: 600,
        backgroundColor: '#fff',
      },
    } as SNLayoutConfig;
  }

  buildScoreConfig(scoreConfig?: SNScoreConfig): SNScoreConfig {
    return scoreConfig!;
  }
}
