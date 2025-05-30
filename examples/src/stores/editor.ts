import { defineStore } from 'pinia';
import { ref } from 'vue';
import { SNTemplate, SNDataType } from '@types';
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

  // Actions
  function updateFormData(data: SNTemplate) {
    formData.value = data;
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
  }

  return {
    // State
    formData,
    abcStr,
    scoreEditorView,
    lyricEditorView,
    activeInputType,

    // Actions
    updateFormData,
    updateAbcStr,
    setScoreEditorView,
    getScoreEditorView,
    setLyricEditorView,
    getLyricEditorView,
    setActiveInputType,
    setEditorSelection,
  };
});
