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
    <div v-show="activePanel === 'lyric'" class="flex flex-col flex-grow min-h-0 overflow-auto">
      <div
        ref="lyricEditorRef"
        class="flex text-sm leading-normal resize-none flex-grow min-h-0 bg-white bg-opacity-80"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate, lineNumbers } from '@codemirror/view';
import { history, defaultKeymap, indentWithTab } from '@codemirror/commands';
import { useEditorStore } from '../../stores';
import { HighlightStyle, syntaxHighlighting, StreamLanguage } from '@codemirror/language';
import { tags } from '@lezer/highlight';

defineProps<{
  activePanel: string;
}>();

const emits = defineEmits(['toggle-accordion']);

const lyricEditorRef = ref<HTMLDivElement | null>(null);
const editorStore = useEditorStore();

// 定义歌词语法高亮样式
const lyricHighlightStyle = HighlightStyle.define([
  { tag: tags.bracket, color: '#7b5aff' }, // 括号
  { tag: tags.punctuation, color: '#ff6b3d' }, // 标点符号
]);

// 定义歌词语法高亮规则
const lyricLanguage = StreamLanguage.define({
  token(stream: any) {
    // 匹配括号
    if (stream.match(/[()[\]{}\d.]/)) return 'bracket';
    // 匹配标点符号
    if (stream.match(/[-]/)) return 'punctuation';
    // 其他文本不进行高亮
    stream.next();
    return null;
  },
});

// 创建语法高亮扩展
const lyricHighlight = syntaxHighlighting(lyricHighlightStyle);

onMounted(() => {
  if (lyricEditorRef.value && editorStore.formData) {
    editorStore.setLyricEditorView(
      new EditorView({
        state: EditorState.create({
          doc: editorStore.formData.lyric,
          extensions: [
            lineNumbers(), // 添加行号
            history(), // 添加历史记录
            keymap.of(defaultKeymap), // 添加默认按键映射
            keymap.of([indentWithTab]),
            lyricLanguage, // 添加语言支持
            lyricHighlight, // 添加语法高亮
            EditorView.updateListener.of((update: ViewUpdate) => {
              if (update.docChanged) {
                const newLyric = update.state.doc.toString();
                if (editorStore.formData && editorStore.formData.lyric !== newLyric) {
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
    if (view && newLyric !== undefined && newLyric !== view.state.doc.toString()) {
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
