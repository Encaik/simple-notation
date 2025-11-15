import { BaseConfig } from './base-config';
import type {
  SNScoreConfig,
  SNScoreRootConfig,
  SNScoreScoreConfig,
  SNScoreSectionConfig,
  SNScoreVoiceConfig,
  SNScoreMeasureConfig,
  SNScoreElementConfig,
} from '@manager/model';
import { SNScoreType, SNChordType } from '@manager/model';

/**
 * 乐谱配置类
 *
 * 管理数据层的配置：根-乐谱-章节-声部-小节-元素
 */
export class ScoreConfig extends BaseConfig<SNScoreConfig> {
  /**
   * 创建乐谱配置实例
   *
   * @param userConfig - 用户配置（可选）
   */
  constructor(userConfig?: Partial<SNScoreConfig>) {
    const defaultConfig = ScoreConfig.getDefault();
    super(defaultConfig, userConfig);
  }

  /**
   * 获取默认乐谱配置
   *
   * @returns 默认乐谱配置
   */
  protected getDefaultConfig(): SNScoreConfig {
    return ScoreConfig.getDefault();
  }

  /**
   * 静态方法：获取默认乐谱配置
   *
   * @returns 默认乐谱配置
   */
  static getDefault(): SNScoreConfig {
    return {
      root: {
        metadata: {
          showTitle: true,
          showSubtitle: true,
          showContributors: true,
        },
        style: {
          font: {
            family: 'Arial',
            size: 14,
            color: '#000000',
            weight: 'normal',
          },
        },
      },
      score: {
        scoreType: SNScoreType.Simple,
        style: {
          backgroundColor: 'transparent',
          font: {
            family: 'Arial',
            size: 14,
            color: '#000000',
          },
        },
        spacing: {
          padding: { top: 10, right: 10, bottom: 10, left: 10 },
        },
      },
      section: {
        style: {
          separator: {
            enable: false,
            style: 'solid',
            color: '#cccccc',
            width: 1,
          },
        },
        spacing: {
          sectionGap: 30,
        },
      },
      voice: {
        display: {
          showName: false,
          nameStyle: {
            fontSize: 12,
            fontFamily: 'Arial',
            color: '#666666',
            position: 'left',
          },
        },
        style: {},
        spacing: {
          voiceGap: 20,
        },
      },
      measure: {
        barline: {
          style: 'single',
          color: '#000000',
          width: 1,
          enable: true,
        },
        style: {},
        spacing: {
          measureGap: 10,
        },
        measureNumber: {
          enable: true,
          frequency: 1,
          style: {
            fontSize: 10,
            fontFamily: 'Arial',
            color: '#666666',
            position: 'left-top',
          },
        },
      },
      element: {
        note: {
          style: {
            size: 1.0,
            color: '#000000',
            fillColor: '#000000',
            stroke: {
              width: 1,
              color: '#000000',
            },
          },
          display: {
            showNoteName: false,
            showDuration: false,
          },
          dot: {
            color: '#000000',
            size: 3,
          },
        },
        rest: {
          style: {
            size: 1.0,
            color: '#000000',
            stroke: {
              width: 1,
              color: '#000000',
            },
          },
        },
        lyric: {
          display: {
            enable: true,
            align: 'center',
          },
          style: {
            fontSize: 14,
            fontFamily: 'Arial',
            color: '#000000',
            fontWeight: 'normal',
            lineHeight: 1.5,
          },
          spacing: {
            noteGap: 5,
            characterGap: 2,
          },
        },
        chord: {
          chordType: SNChordType.Default,
          display: {
            enable: true,
            position: 'above',
          },
          style: {
            fontSize: 12,
            fontFamily: 'Arial',
            color: '#000000',
            backgroundColor: 'transparent',
            border: {
              width: 0,
              color: '#000000',
              radius: 0,
            },
          },
        },
        tie: {
          style: {
            type: 'slur',
            color: '#000000',
            width: 2,
            curvature: 0.5,
          },
        },
        tuplet: {
          display: {
            enable: true,
            position: 'above',
          },
          style: {
            fontSize: 10,
            color: '#000000',
            bracket: {
              enable: true,
              style: 'square',
              color: '#000000',
              width: 1,
            },
          },
        },
      },
    };
  }

  /**
   * 获取根配置
   */
  getRoot(): Readonly<SNScoreRootConfig> {
    return this.get().root;
  }

  /**
   * 更新根配置
   */
  setRoot(config: Partial<SNScoreRootConfig>): void {
    this.set({ root: { ...this.get().root, ...config } });
  }

  /**
   * 获取乐谱配置
   */
  getScore(): Readonly<SNScoreScoreConfig> {
    return this.get().score;
  }

  /**
   * 更新乐谱配置
   */
  setScore(config: Partial<SNScoreScoreConfig>): void {
    this.set({ score: { ...this.get().score, ...config } });
  }

  /**
   * 获取章节配置
   */
  getSection(): Readonly<SNScoreSectionConfig> {
    return this.get().section;
  }

  /**
   * 更新章节配置
   */
  setSection(config: Partial<SNScoreSectionConfig>): void {
    this.set({ section: { ...this.get().section, ...config } });
  }

  /**
   * 获取声部配置
   */
  getVoice(): Readonly<SNScoreVoiceConfig> {
    return this.get().voice;
  }

  /**
   * 更新声部配置
   */
  setVoice(config: Partial<SNScoreVoiceConfig>): void {
    this.set({ voice: { ...this.get().voice, ...config } });
  }

  /**
   * 获取小节配置
   */
  getMeasure(): Readonly<SNScoreMeasureConfig> {
    return this.get().measure;
  }

  /**
   * 更新小节配置
   */
  setMeasure(config: Partial<SNScoreMeasureConfig>): void {
    this.set({ measure: { ...this.get().measure, ...config } });
  }

  /**
   * 获取元素配置
   */
  getElement(): Readonly<SNScoreElementConfig> {
    return this.get().element;
  }

  /**
   * 更新元素配置
   */
  setElement(config: Partial<SNScoreElementConfig>): void {
    this.set({ element: { ...this.get().element, ...config } });
  }
}
