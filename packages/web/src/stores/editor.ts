import { defineStore } from 'pinia';
import type { EditorView } from '@codemirror/view';
import {
  type SNTemplate,
  type SNContent,
  SNDataType,
  type SNOptions,
  SNChordType,
  SNScoreType,
} from 'simple-notation';
import { ref } from 'vue';

// 编曲工具音符数据接口
export interface PianoRollNote {
  index: number;
  pitch: number;
  pitchName: string;
  start: number;
  duration: number;
}

export const useEditorStore = defineStore('editor', {
  state: () => ({
    formData: {
      info: {
        title: '未命名',
        composer: '未命名',
        lyricist: '未命名',
        time: '4',
        tempo: '120',
        key: 'C',
        beat: '4',
        author: '未命名',
      },
      score: ``,
      lyric: ``,
    } as SNTemplate,
    abcStr: '',
    scoreEditorView: null as EditorView | null,
    lyricEditorView: null as EditorView | null,
    activeInputType: SNDataType.TEMPLATE,
    snOptions: {
      resize: true,
      debug: false,
      score: {
        chordType: SNChordType.Default,
        scoreType: SNScoreType.Simple,
      },
    } as Partial<SNOptions>,
    selectionRange: { start: null as number | null, end: null as number | null },
    isEditingFromScoreEditor: false,
    pianoRollNotes: [] as PianoRollNote[],
    scoreToConvert: null as string | null,
    beatsPerBarToConvert: null as number | null,
  }),

  actions: {
    updateFormData(data: SNTemplate) {
      this.formData = data;
    },
    updateScore(score: string) {
      if (this.formData) {
        this.formData.score = score;
      }
    },
    updateLyric(lyric: string) {
      if (this.formData) {
        this.formData.lyric = lyric;
      }
    },
    updateAbcStr(str: string) {
      this.abcStr = str;
    },
    setScoreEditorView(view: EditorView) {
      this.scoreEditorView = view;
    },
    getScoreEditorView() {
      return this.scoreEditorView;
    },
    setLyricEditorView(view: EditorView) {
      this.lyricEditorView = view;
    },
    getLyricEditorView() {
      return this.lyricEditorView;
    },
    setActiveInputType(type: SNDataType) {
      this.activeInputType = type;
    },
    setEditorSelection(start: number, end: number) {
      this.scoreEditorView?.dispatch({
        selection: { anchor: start, head: end },
        scrollIntoView: true,
      });
      this.scoreEditorView?.focus();
    },
    setSelectionRange(start: number | null, end: number | null) {
      this.selectionRange = { start, end };
    },
    updateSnOptions(options: Partial<SNOptions>) {
      this.snOptions = {
        ...this.snOptions,
        ...options,
      };
    },
    resetSnOptions() {
      this.snOptions = {
        resize: true,
        debug: false,
        score: {
          chordType: SNChordType.Default,
          scoreType: SNScoreType.Simple,
        },
      };
    },
    setConversionData(score: string, beatsPerBar: number) {
      this.scoreToConvert = score;
      this.beatsPerBarToConvert = beatsPerBar;
    },
    clearConversionData() {
      this.scoreToConvert = null;
      this.beatsPerBarToConvert = null;
    },
  },
});
