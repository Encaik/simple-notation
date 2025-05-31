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

defineProps<{
  activePanel: string;
}>();

const emits = defineEmits(['toggle-accordion']);

const scoreEditorRef = ref<HTMLDivElement | null>(null);
const editorStore = useEditorStore();

onMounted(() => {
  if (scoreEditorRef.value && editorStore.formData) {
    editorStore.setScoreEditorView(
      new EditorView({
        state: EditorState.create({
          doc: editorStore.formData.score,
          extensions: [
            basicSetup,
            keymap.of([indentWithTab]),
            // TODO: 添加简谱语法高亮模式
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

function updateScore(value: string) {
  if (editorStore.formData) {
    editorStore.formData.score = value;
  }
}
</script>

<style>
.cm-editor {
  flex: 1;
}
</style>
