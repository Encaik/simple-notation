import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  SNTemplate,
  SNDataType,
  SNOptions,
  SNChordType,
  SNScoreType,
} from '@types';
import { EditorView } from '@codemirror/view';

export const useEditorStore = defineStore('editor', () => {
  // State
  const formData = ref<SNTemplate>({
    info: {
      title: '小星星',
      composer: 'Mozart, W.A.',
      lyricist: '佚名',
      time: '4',
      tempo: '88',
      key: 'C',
      beat: '4',
    },
    score: `1,1,5,5|6,6,5,-|4,4,3,3\n2,2,1,-|5,5,4,4|3,3,2,-\n5,5,4,4|3,3,2,-|1,1,5,5\n6,6,5,-|4,4,3,3|2,2,1,-`,
    lyric: `一闪一闪亮晶晶-\n满天都是小星星-\n挂在天空放光明-\n好像千颗小眼睛-\n一闪一闪亮晶晶-\n满天都是小星星`,
  });
  const abcStr = ref(
    `X: 1\nT: Cooley's\nM: 4/4\nL: 1/8\nQ: 1/4 = 80\nK: Emin\n|:D2|"Em"EBBA B2 EB|~B2 AB dBAG|\n|"D"FDAD BDAD|FDAD dAFD|"Em"EBBA B2 EB|\n|B2 AB defg|"D"afe^c dBAF|"Em"DEFD E2:|||\n|:gf|"Em"eB B2 efge|eB B2 gedB|\n|"D"A2 FA DAFA|A2 FA defg|\n|"Em"eB B2 eBgB|eB B2 defg|\n|"D"afe^c dBAF|"Em"DEFD E2:|`,
  );
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
      ...snOptions.value,
      ...options,
      score: {
        ...snOptions.value.score,
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
