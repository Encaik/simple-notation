import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  type SNTemplate,
  SNDataType,
  type SNOptions,
  SNChordType,
  SNScoreType,
} from 'simple-notation';
import { EditorView } from '@codemirror/view';

// 编曲工具音符数据接口
export interface PianoRollNote {
  index: number;
  pitch: number;
  pitchName: string;
  start: number;
  duration: number;
}

export const useEditorStore = defineStore('editor', () => {
  // State
  const formData = ref<SNTemplate>({
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
  });
  const abcStr = ref('');
  const scoreEditorView = ref<EditorView | null>(null);
  const lyricEditorView = ref<EditorView | null>(null);
  const activeInputType = ref<SNDataType>(SNDataType.TEMPLATE);
  const snOptions = ref<Partial<SNOptions>>({
    resize: true,
    debug: false,
    score: {
      lineHeight: 50,
      lineSpace: 10,
      padding: 10,
      lyricHeight: 25,
      chordHeight: 0,
      lineWeight: 200,
      allowOverWeight: 40,
      chordType: SNChordType.Default,
      scoreType: SNScoreType.Simple,
      showChordLine: false,
      chordLineHeight: 0,
    },
  });

  // Add state for editor selection range
  const selectionRange = ref<{ start: number | null; end: number | null }>({
    start: null,
    end: null,
  });

  const isEditingFromScoreEditor = ref(false);
  const pianoRollNotes = ref<PianoRollNote[]>([]);

  // Actions
  function updateFormData(data: SNTemplate) {
    formData.value = data;
  }

  function updateScore(score: string) {
    if (formData.value) {
      formData.value.score = score;
    }
  }

  function updateLyric(lyric: string) {
    if (formData.value) {
      formData.value.lyric = lyric;
    }
  }

  function updateAbcStr(str: string) {
    abcStr.value = str;
  }

  function setScoreEditorView(view: EditorView) {
    scoreEditorView.value = view;
  }

  function getScoreEditorView() {
    return scoreEditorView.value;
  }

  function setLyricEditorView(view: EditorView) {
    lyricEditorView.value = view;
  }

  function getLyricEditorView() {
    return lyricEditorView.value;
  }

  function setActiveInputType(type: SNDataType) {
    activeInputType.value = type;
  }

  function setEditorSelection(start: number, end: number) {
    scoreEditorView.value?.dispatch({
      selection: { anchor: start, head: end },
      scrollIntoView: true,
    });
    scoreEditorView.value?.focus();
  }

  function setSelectionRange(start: number | null, end: number | null) {
    selectionRange.value = { start, end };
  }

  function updateSnOptions(options: Partial<SNOptions>) {
    snOptions.value = {
      resize: true,
      debug: false,
      ...options,
      score: {
        lineHeight: 50,
        lineSpace: 10,
        padding: 10,
        lyricHeight: 25,
        chordHeight: 0,
        lineWeight: 200,
        allowOverWeight: 40,
        chordType: SNChordType.Default,
        scoreType: SNScoreType.Simple,
        showChordLine: false,
        chordLineHeight: 0,
        ...options.score,
      },
    };
  }

  function resetSnOptions() {
    snOptions.value = {
      resize: true,
      debug: false,
      score: {
        lineHeight: 50,
        lineSpace: 10,
        padding: 10,
        lyricHeight: 25,
        chordHeight: 0,
        lineWeight: 200,
        allowOverWeight: 40,
        chordType: SNChordType.Default,
        scoreType: SNScoreType.Simple,
        showChordLine: false,
        chordLineHeight: 0,
      },
    };
  }

  return {
    // State
    formData,
    abcStr,
    scoreEditorView,
    lyricEditorView,
    activeInputType,
    snOptions,
    selectionRange,
    isEditingFromScoreEditor,
    pianoRollNotes,

    // Actions
    updateFormData,
    updateScore,
    updateLyric,
    updateAbcStr,
    setScoreEditorView,
    getScoreEditorView,
    setLyricEditorView,
    getLyricEditorView,
    setActiveInputType,
    setEditorSelection,
    setSelectionRange,
    updateSnOptions,
    resetSnOptions,
  };
});
