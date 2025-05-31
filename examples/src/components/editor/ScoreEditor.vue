<template>
  <div
    class="border border-[#ddd] rounded-md flex flex-col min-h-0"
    :class="{
      'flex-grow': activePanel === 'score',
      'flex-shrink-0': activePanel !== 'score',
      'h-auto': activePanel !== 'score',
    }"
  >
    <button
      class="w-full text-left py-3 px-4 rounded-md bg-[#f7f7f7] text-[#333] font-medium flex justify-between items-center transition duration-300 hover:bg-[#eee] focus:outline-none flex-shrink-0"
      @click="toggleAccordion"
    >
      简谱
      <span>{{ activePanel === 'score' ? '▲' : '▼' }}</span>
    </button>
    <div
      v-show="activePanel === 'score'"
      class="flex flex-col flex-grow min-h-0 overflow-auto"
    >
      <div
        ref="scoreEditorRef"
        class="flex text-sm leading-normal resize-none flex-grow min-h-0 bg-white bg-opacity-80"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  defineProps,
  defineEmits,
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
} from 'vue';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { basicSetup } from '@codemirror/basic-setup';
import { indentWithTab } from '@codemirror/commands';
import { useEditorStore } from '../../stores';
import {
  HighlightStyle,
  syntaxHighlighting,
  StreamLanguage,
} from '@codemirror/language';
import { tags } from '@lezer/highlight';

defineProps<{
  activePanel: string;
}>();

const emits = defineEmits(['toggle-accordion']);

const scoreEditorRef = ref<HTMLDivElement | null>(null);
const editorStore = useEditorStore();

// 定义简谱语法高亮样式
const scoreHighlightStyle = HighlightStyle.define([
  { tag: tags.bracket, color: '#7b5aff' }, // 括号类符号
  { tag: tags.punctuation, color: '#ff6b3d' }, // 标点符号
]);

// 定义简谱语法高亮规则
const scoreLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.match(/<[^}]*>/)) return 'bracket';
    if (stream.match(/{[^}]*}/)) return 'bracket';
    if (stream.match(/[()[\]()]/)) return 'bracket';
    if (stream.match(/[,|]/)) return 'punctuation';
    stream.next();
    return null;
  },
});

// 创建语法高亮扩展
const scoreHighlight = syntaxHighlighting(scoreHighlightStyle);

onMounted(() => {
  if (scoreEditorRef.value && editorStore.formData) {
    editorStore.setScoreEditorView(
      new EditorView({
        state: EditorState.create({
          doc: editorStore.formData.score,
          extensions: [
            basicSetup,
            keymap.of([indentWithTab]),
            scoreLanguage, // 添加语言支持
            scoreHighlight, // 添加语法高亮
            EditorView.updateListener.of((update: ViewUpdate) => {
              if (update.docChanged) {
                const newScore = update.state.doc.toString();
                if (
                  editorStore.formData &&
                  editorStore.formData.score !== newScore
                ) {
                  editorStore.updateScore(newScore);
                }
              }
            }),
          ],
        }),
        parent: scoreEditorRef.value,
      }),
    );
  }
});

watch(
  () => editorStore.formData?.score,
  (newScore) => {
    const view = editorStore.scoreEditorView;
    if (
      view &&
      newScore !== undefined &&
      newScore !== view.state.doc.toString()
    ) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: newScore,
        },
      });
    }
  },
);

onBeforeUnmount(() => {
  editorStore.scoreEditorView?.destroy();
});

const toggleAccordion = () => {
  emits('toggle-accordion', 'score');
};
</script>

<style>
.cm-editor {
  flex: 1;
  font-size: 16px;
  line-height: 1.6;
}

.cm-content {
  font-size: 16px;
  line-height: 1.6;
}

.cm-cursor {
  height: 1.6em;
}

.cm-selectionBackground {
  height: 1.6em;
}
</style>
