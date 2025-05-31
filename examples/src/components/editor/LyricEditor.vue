<template>
  <div
    class="border border-[#ddd] rounded-md flex flex-col min-h-0"
    :class="{
      'flex-grow': activePanel === 'lyric',
      'flex-shrink-0': activePanel !== 'lyric',
      'h-auto': activePanel !== 'lyric',
    }"
  >
    <button
      class="w-full text-left py-3 px-4 rounded-md bg-[#f7f7f7] text-[#333] font-medium flex justify-between items-center transition duration-300 hover:bg-[#eee] focus:outline-none flex-shrink-0"
      @click="toggleAccordion"
    >
      歌词
      <span>{{ activePanel === 'lyric' ? '▲' : '▼' }}</span>
    </button>
    <div
      v-show="activePanel === 'lyric'"
      class="flex flex-col flex-grow min-h-0 overflow-auto"
    >
      <div
        ref="lyricEditorRef"
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

const lyricEditorRef = ref<HTMLDivElement | null>(null);
const editorStore = useEditorStore();

onMounted(() => {
  if (lyricEditorRef.value && editorStore.formData) {
    editorStore.setLyricEditorView(
      new EditorView({
        state: EditorState.create({
          doc: editorStore.formData.lyric,
          extensions: [
            basicSetup,
            keymap.of([indentWithTab]),
            // TODO: 添加歌词语法高亮模式
            EditorView.updateListener.of((update: ViewUpdate) => {
              if (update.docChanged) {
                const newLyric = update.state.doc.toString();
                if (
                  editorStore.formData &&
                  editorStore.formData.lyric !== newLyric
                ) {
                  editorStore.updateLyric(newLyric);
                }
              }
            }),
          ],
        }),
        parent: lyricEditorRef.value,
      }),
    );
  }
});

watch(
  () => editorStore.formData?.lyric,
  (newLyric) => {
    const view = editorStore.lyricEditorView;
    if (
      view &&
      newLyric !== undefined &&
      newLyric !== view.state.doc.toString()
    ) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: newLyric,
        },
      });
    }
  },
);

onBeforeUnmount(() => {
  editorStore.lyricEditorView?.destroy();
});

const toggleAccordion = () => {
  emits('toggle-accordion', 'lyric');
};

function updateLyric(value: string) {
  if (editorStore.formData) {
    editorStore.formData.lyric = value;
  }
}
</script>

<style>
.cm-editor {
  flex: 1;
}
</style>
