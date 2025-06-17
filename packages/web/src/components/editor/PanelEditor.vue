<template>
  <Card class="flex-1 w-0 max-[1200px]:w-auto backdrop-blur-sm min-h-0">
    <div class="flex gap-2 mb-4 border-b border-[#ddd] pb-0 flex-shrink-0">
      <button
        :class="{
          'bg-white text-[#007bff] border-b-white z-20':
            editorStore.activeInputType === SNDataType.TEMPLATE,
          'bg-[#f7f7f7] text-[#333] border-b-none z-10':
            editorStore.activeInputType !== SNDataType.TEMPLATE,
        }"
        class="py-2 px-5 border border-[#ddd] rounded-t-lg font-medium cursor-pointer outline-none transition duration-200 mr-[-1px] relative"
        @click="changeType(SNDataType.TEMPLATE)"
      >
        默认模板
      </button>
      <button
        :class="{
          'bg-white text-[#007bff] border-b-white z-20':
            editorStore.activeInputType === SNDataType.ABC,
          'bg-[#f7f7f7] text-[#333] border-b-none z-10':
            editorStore.activeInputType !== SNDataType.ABC,
        }"
        class="py-2 px-5 border border-[#ddd] rounded-t-lg font-medium cursor-pointer outline-none transition duration-200 mr-[-1px] relative"
        @click="changeType(SNDataType.ABC)"
      >
        ABC(🚧施工中)
      </button>
    </div>
    <div
      class="flex flex-col flex-1 min-h-0"
      v-show="editorStore.activeInputType === SNDataType.TEMPLATE && editorStore.formData"
    >
      <div class="flex flex-col flex-grow min-h-0 gap-4">
        <BaseInfo
          v-if="editorStore.formData"
          :form-data="editorStore.formData"
          :active-panel="activePanel"
          @toggle-accordion="toggleAccordion"
        />
        <ScoreEditor
          v-if="editorStore.formData"
          :form-data="editorStore.formData"
          :active-panel="activePanel"
          @toggle-accordion="toggleAccordion"
        />
        <LyricEditor
          v-if="editorStore.formData"
          :form-data="editorStore.formData"
          :active-panel="activePanel"
          @toggle-accordion="toggleAccordion"
        />
        <SnOptions
          v-if="editorStore.formData && editorStore.snOptions"
          :options="editorStore.snOptions"
          :active-panel="activePanel"
          @update:options="editorStore.updateSnOptions"
          @toggle-accordion="toggleAccordion"
        />
      </div>
    </div>
    <div class="flex flex-col flex-1" v-show="editorStore.activeInputType === SNDataType.ABC">
      <div class="flex flex-col gap-2 flex-1 min-h-0">
        <label for="abc-input" class="font-medium text-[#333] whitespace-nowrap">ABC</label>
        <textarea
          id="abc-input"
          :value="editorStore.abcStr || ''"
          @input="editorStore.updateAbcStr(($event.target as HTMLTextAreaElement).value)"
          placeholder="请输入ABC内容..."
          class="flex-1 p-3 border border-[#ddd] rounded text-sm leading-normal resize-none min-h-0 bg-white bg-opacity-80 box-border"
        ></textarea>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { defineEmits, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { SNDataType } from 'simple-notation';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate, lineNumbers } from '@codemirror/view';
import { history, defaultKeymap, indentWithTab } from '@codemirror/commands';
import { useEditorStore } from '../../stores';
import BaseInfo from './BaseInfo.vue';
import ScoreEditor from './ScoreEditor.vue';
import LyricEditor from './LyricEditor.vue';
import SnOptions from './SnOptions.vue';

/**
 * PanelEditor emits
 * @event update:formData
 * @event update:abcStr
 * @event change-type
 * @event update:options
 */
const emits = defineEmits([]);

const editorStore = useEditorStore();
const activePanel = ref('score');

const toggleAccordion = (panel: string) => {
  activePanel.value = activePanel.value === panel ? '' : panel;
};

/**
 * 切换输入类型
 * @param {SNDataType} type - 输入类型
 * @returns {void}
 */
function changeType(type: SNDataType) {
  editorStore.setActiveInputType(type);
}

const scoreEditorRef = ref<HTMLDivElement | null>(null);
const lyricEditorRef = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (scoreEditorRef.value && editorStore.formData) {
    editorStore.setScoreEditorView(
      new EditorView({
        state: EditorState.create({
          doc: editorStore.formData.score,
          extensions: [
            lineNumbers(),
            history(),
            keymap.of(defaultKeymap),
            keymap.of([indentWithTab]),
            // TODO: 添加简谱语法高亮模式
            EditorView.updateListener.of((update: ViewUpdate) => {
              if (update.docChanged) {
                const newScore = update.state.doc.toString();
                if (editorStore.formData && editorStore.formData.score !== newScore) {
                  editorStore.updateFormData({
                    ...editorStore.formData,
                    score: newScore,
                  });
                }
              }
            }),
          ],
        }),
        parent: scoreEditorRef.value,
      }),
    );
  }
  if (lyricEditorRef.value && editorStore.formData) {
    editorStore.setLyricEditorView(
      new EditorView({
        state: EditorState.create({
          doc: editorStore.formData.lyric,
          extensions: [
            lineNumbers(),
            history(),
            keymap.of(defaultKeymap),
            keymap.of([indentWithTab]),
            // TODO: 添加歌词语法高亮模式
            EditorView.updateListener.of((update: ViewUpdate) => {
              if (update.docChanged) {
                const newLyric = update.state.doc.toString();
                if (editorStore.formData && editorStore.formData.lyric !== newLyric) {
                  editorStore.updateFormData({
                    ...editorStore.formData,
                    lyric: newLyric,
                  });
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
  () => editorStore.formData?.score,
  (newScore) => {
    const view = editorStore.scoreEditorView;
    if (view && newScore !== undefined && newScore !== view.state.doc.toString()) {
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

// 在组件销毁前清理编辑器实例
onBeforeUnmount(() => {
  editorStore.scoreEditorView?.destroy();
  editorStore.lyricEditorView?.destroy();
});
</script>

<style>
.cm-editor {
  flex: 1;
}
</style>
