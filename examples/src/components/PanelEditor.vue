<template>
  <div
    class="flex-1 bg-white bg-opacity-95 p-5 rounded-lg shadow-md flex flex-col gap-4 overflow-hidden backdrop-blur-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-300 min-h-0"
  >
    <div class="flex gap-2 mb-4 border-b border-[#ddd] pb-0 flex-shrink-0">
      <button
        :class="{
          'bg-white text-[#007bff] border-b-white z-20':
            inputType === SNDataType.TEMPLATE,
          'bg-[#f7f7f7] text-[#333] border-b-none z-10':
            inputType !== SNDataType.TEMPLATE,
        }"
        class="py-2 px-5 border border-[#ddd] rounded-t-lg font-medium cursor-pointer outline-none transition duration-200 mr-[-1px] relative"
        @click="changeType(SNDataType.TEMPLATE)"
      >
        默认模板
      </button>
      <button
        :class="{
          'bg-white text-[#007bff] border-b-white z-20':
            inputType === SNDataType.ABC,
          'bg-[#f7f7f7] text-[#333] border-b-none z-10':
            inputType !== SNDataType.ABC,
        }"
        class="py-2 px-5 border border-[#ddd] rounded-t-lg font-medium cursor-pointer outline-none transition duration-200 mr-[-1px] relative"
        @click="changeType(SNDataType.ABC)"
      >
        ABC(🚧施工中)
      </button>
    </div>
    <div
      class="flex flex-col flex-1"
      v-show="inputType === SNDataType.TEMPLATE && formData"
    >
      <div class="flex flex-col flex-grow min-h-0 gap-4">
        <!-- 基本信息 手风琴 -->
        <div
          class="border border-[#ddd] rounded-md flex flex-col min-h-0"
          :class="{
            'flex-grow': activePanel === 'basicInfo',
            'flex-shrink-0': activePanel !== 'basicInfo',
            'h-auto': activePanel !== 'basicInfo',
          }"
        >
          <button
            class="w-full text-left py-3 px-4 rounded-md bg-[#f7f7f7] text-[#333] font-medium flex justify-between items-center transition duration-300 hover:bg-[#eee] focus:outline-none flex-shrink-0"
            @click="toggleAccordion('basicInfo')"
          >
            基本信息
            <span>{{ activePanel === 'basicInfo' ? '▲' : '▼' }}</span>
          </button>
          <div
            v-if="activePanel === 'basicInfo'"
            class="p-4 grid grid-cols-2 gap-4 gap-x-6 overflow-y-auto xl:overflow-visible min-h-0 items-start"
          >
            <div class="flex flex-col gap-2 min-w-0">
              <label
                for="title-input"
                class="font-medium text-[#333] whitespace-nowrap"
                >标题</label
              >
              <input
                type="text"
                id="title-input"
                :value="formData!.info.title"
                @input="
                  $emit('update:formData', {
                    ...formData,
                    info: {
                      ...formData!.info,
                      title: ($event.target as HTMLInputElement).value,
                    },
                  })
                "
                placeholder="请输入标题..."
                class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              />
            </div>
            <div class="flex flex-col gap-2 min-w-0">
              <label
                for="composer-input"
                class="font-medium text-[#333] whitespace-nowrap"
                >作曲</label
              >
              <input
                type="text"
                id="composer-input"
                :value="formData!.info.composer"
                @input="
                  $emit('update:formData', {
                    ...formData,
                    info: {
                      ...formData!.info,
                      composer: ($event.target as HTMLInputElement).value,
                    },
                  })
                "
                placeholder="请输入作曲..."
                class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              />
            </div>
            <div class="flex flex-col gap-2 min-w-0">
              <label
                for="lyricist-input"
                class="font-medium text-[#333] whitespace-nowrap"
                >作词</label
              >
              <input
                type="text"
                id="lyricist-input"
                v-model="formData!.info.lyricist"
                placeholder="请输入作词..."
                class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              />
            </div>
            <div class="flex flex-col gap-2 min-w-0">
              <label
                for="time-input"
                class="font-medium text-[#333] whitespace-nowrap"
                >拍号</label
              >
              <input
                type="text"
                id="time-input"
                v-model="formData!.info.time"
                placeholder="请输入拍号..."
                class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              />
            </div>
            <div class="flex flex-col gap-2 min-w-0">
              <label
                for="tempo-input"
                class="font-medium text-[#333] whitespace-nowrap"
                >速度</label
              >
              <input
                type="text"
                id="tempo-input"
                v-model="formData!.info.tempo"
                placeholder="请输入速度..."
                class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              />
            </div>
            <div class="flex flex-col gap-2 min-w-0">
              <label
                for="key-input"
                class="font-medium text-[#333] whitespace-nowrap"
                >调号</label
              >
              <select
                id="key-input"
                v-model="formData!.info.key"
                placeholder="请选择调号..."
                class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              >
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C#">C#</option>
                <option value="D#">D#</option>
                <option value="E#">E#</option>
                <option value="F#">F#</option>
                <option value="G#">G#</option>
                <option value="A#">A#</option>
                <option value="B#">B#</option>
                <option value="Cb">Cb</option>
                <option value="Db">Db</option>
                <option value="Eb">Eb</option>
                <option value="Fb">Fb</option>
                <option value="Gb">Gb</option>
                <option value="Ab">Ab</option>
                <option value="Bb">Bb</option>
              </select>
            </div>
            <div class="flex flex-col gap-2 min-w-0">
              <label
                for="beat-input"
                class="font-medium text-[#333] whitespace-nowrap"
                >节拍</label
              >
              <input
                type="text"
                id="beat-input"
                v-model="formData!.info.beat"
                placeholder="请输入节拍..."
                class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              />
            </div>
          </div>
        </div>

        <!-- 简谱 手风琴 -->
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
            @click="toggleAccordion('score')"
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

        <!-- 歌词 手风琴 -->
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
            @click="toggleAccordion('lyric')"
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
      </div>
    </div>
    <div class="flex flex-col flex-1" v-show="inputType === SNDataType.ABC">
      <div class="flex flex-col gap-2 flex-1 min-h-0">
        <label for="abc-input" class="font-medium text-[#333] whitespace-nowrap"
          >ABC</label
        >
        <textarea
          id="abc-input"
          :value="abcStr || ''"
          @input="
            $emit('update:abcStr', ($event.target as HTMLTextAreaElement).value)
          "
          placeholder="请输入ABC内容..."
          class="flex-1 p-3 border border-[#ddd] rounded text-sm leading-normal resize-none min-h-0 bg-white bg-opacity-80 box-border"
        ></textarea>
      </div>
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
import { SNDataType, SNTemplate } from '../../../lib/src/types/sn';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { basicSetup } from '@codemirror/basic-setup';
import { indentWithTab } from '@codemirror/commands';
import { useEditorStore } from '../stores';

/**
 * PanelEditor 组件 props
 * @typedef {Object} PanelEditorProps
 * @property {object=} formData - 默认模板数据
 * @property {SNDataType} inputType - 输入类型
 * @property {string=} abcStr - abc字符串
 */
const props = defineProps<{
  formData?: SNTemplate;
  inputType: SNDataType;
  abcStr?: string;
}>();

/**
 * PanelEditor emits
 * @event update:formData
 * @event update:abcStr
 * @event change-type
 */
const emits = defineEmits(['update:formData', 'update:abcStr', 'change-type']);
/**
 * 切换输入类型
 * @param {SNDataType} type - 输入类型
 * @returns {void}
 */
function changeType(type: SNDataType) {
  emits('change-type', type);
}

const activePanel = ref('score');
const toggleAccordion = (panel: string) => {
  activePanel.value = activePanel.value === panel ? '' : panel;
};

const editorStore = useEditorStore();

const scoreEditorRef = ref<HTMLDivElement | null>(null);
const lyricEditorRef = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (scoreEditorRef.value && props.formData) {
    editorStore.setScoreEditorView(
      new EditorView({
        state: EditorState.create({
          doc: props.formData.score,
          extensions: [
            basicSetup,
            keymap.of([indentWithTab]),
            // TODO: 添加简谱语法高亮模式
            EditorView.updateListener.of((update: ViewUpdate) => {
              if (update.docChanged) {
                const newScore = update.state.doc.toString();
                if (props.formData && props.formData.score !== newScore) {
                  emits('update:formData', {
                    ...props.formData,
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
  if (lyricEditorRef.value && props.formData) {
    editorStore.setLyricEditorView(
      new EditorView({
        state: EditorState.create({
          doc: props.formData.lyric,
          extensions: [
            basicSetup,
            keymap.of([indentWithTab]),
            // TODO: 添加歌词语法高亮模式
            EditorView.updateListener.of((update: ViewUpdate) => {
              if (update.docChanged) {
                const newLyric = update.state.doc.toString();
                if (props.formData && props.formData.lyric !== newLyric) {
                  emits('update:formData', {
                    ...props.formData,
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
  () => props.formData?.score,
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

watch(
  () => props.formData?.lyric,
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
