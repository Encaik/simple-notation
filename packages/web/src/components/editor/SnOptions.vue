<template>
  <div
    class="border border-[#ddd] rounded-md flex flex-col min-h-0"
    :class="{
      'flex-grow': activePanel === 'snOptions',
      'flex-shrink-0': activePanel !== 'snOptions',
      'h-auto': activePanel !== 'snOptions',
    }"
  >
    <button
      class="w-full text-left py-3 px-4 rounded-md bg-[#f7f7f7] text-[#333] font-medium flex justify-between items-center transition duration-300 hover:bg-[#eee] focus:outline-none flex-shrink-0"
      @click="toggleAccordion"
    >
      SN渲染配置
      <span>{{ activePanel === 'snOptions' ? '▲' : '▼' }}</span>
    </button>
    <div v-if="activePanel === 'snOptions'" class="flex flex-col overflow-y-auto min-h-0">
      <div class="options-section p-[15px]">
        <h3 class="mt-0 mb-[15px] text-[#555] text-lg">通用</h3>
        <div class="options-grid grid grid-cols-2 gap-4 gap-x-6">
          <div class="input-group flex flex-col gap-2">
            <label for="resize-input" class="font-medium text-[#333] whitespace-nowrap"
              >自适应</label
            >
            <select
              id="resize-input"
              v-model="editorStore.snOptions.resize"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
            >
              <option :value="true">开启</option>
              <option :value="false">关闭</option>
            </select>
          </div>
          <div class="input-group flex flex-col gap-2">
            <label for="debug-input" class="font-medium text-[#333] whitespace-nowrap"
              >Debug 模式</label
            >
            <select
              id="debug-input"
              v-model="editorStore.snOptions.debug"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
            >
              <option :value="true">开启</option>
              <option :value="false">关闭</option>
            </select>
          </div>
        </div>
      </div>

      <div class="options-section p-[15px]">
        <h3 class="mt-0 mb-[15px] text-[#555] text-lg">乐谱</h3>
        <div class="options-grid grid grid-cols-2 gap-4 gap-x-6">
          <!-- 和弦显示类型 -->
          <div class="input-group flex flex-col gap-2">
            <!--
            * @description 和弦显示类型选择
            -->
            <label for="chord-type-input" class="font-medium text-[#333] whitespace-nowrap"
              >和弦显示类型</label
            >
            <select
              id="chord-type-input"
              v-model="editorStore.snOptions.score!.chordType"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
            >
              <option :value="SNChordType.Default">默认</option>
              <option :value="SNChordType.Guitar">吉他</option>
            </select>
          </div>
          <!-- 乐谱显示类型 -->
          <div class="input-group flex flex-col gap-2">
            <!--
            * @description 乐谱显示类型选择
            -->
            <label for="score-type-input" class="font-medium text-[#333] whitespace-nowrap"
              >乐谱显示类型</label
            >
            <select
              id="score-type-input"
              v-model="editorStore.snOptions.score!.scoreType"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
            >
              <option :value="SNScoreType.Simple">简谱</option>
              <option :value="SNScoreType.Guitar">吉他谱</option>
              <!-- <option :value="SNScoreType.SimpleGuirar">简谱+吉他谱</option> -->
            </select>
          </div>
          <!-- 行高 -->
          <div class="input-group flex flex-col gap-2">
            <!--
            * @description 每行乐谱的高度
            -->
            <label for="line-height-input" class="font-medium text-[#333] whitespace-nowrap"
              >行高</label
            >
            <input
              id="line-height-input"
              type="number"
              v-model.number="editorStore.snOptions.score!.lineHeight"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              min="1"
            />
          </div>
          <!-- 行间距 -->
          <div class="input-group flex flex-col gap-2">
            <!--
            * @description 乐谱行与行之间的间距
            -->
            <label for="line-space-input" class="font-medium text-[#333] whitespace-nowrap"
              >行间距</label
            >
            <input
              id="line-space-input"
              type="number"
              v-model.number="editorStore.snOptions.score!.lineSpace"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              min="0"
            />
          </div>
          <!-- 乐谱内边距 -->
          <div class="input-group flex flex-col gap-2">
            <!--
            * @description 乐谱整体的内边距
            -->
            <label for="score-padding-input" class="font-medium text-[#333] whitespace-nowrap"
              >乐谱内边距</label
            >
            <input
              id="score-padding-input"
              type="number"
              v-model.number="editorStore.snOptions.score!.padding"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              min="0"
            />
          </div>
          <!-- 歌词高度 -->
          <div class="input-group flex flex-col gap-2">
            <!--
            * @description 歌词区域的高度
            -->
            <label for="lyric-height-input" class="font-medium text-[#333] whitespace-nowrap"
              >歌词高度</label
            >
            <input
              id="lyric-height-input"
              type="number"
              v-model.number="editorStore.snOptions.score!.lyricHeight"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              min="0"
            />
          </div>
          <!-- 和弦高度 -->
          <div class="input-group flex flex-col gap-2">
            <!--
            * @description 和弦区域的高度
            -->
            <label for="chord-height-input" class="font-medium text-[#333] whitespace-nowrap"
              >和弦高度</label
            >
            <input
              id="chord-height-input"
              type="number"
              v-model.number="editorStore.snOptions.score!.chordHeight"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              min="0"
            />
          </div>
          <!-- 行最大宽度 -->
          <div class="input-group flex flex-col gap-2">
            <!--
            * @description 每行乐谱的最大宽度
            -->
            <label for="line-weight-input" class="font-medium text-[#333] whitespace-nowrap"
              >行最大宽度</label
            >
            <input
              id="line-weight-input"
              type="number"
              v-model.number="editorStore.snOptions.score!.lineWeight"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              min="1"
            />
          </div>
          <!-- 允许超宽 -->
          <div class="input-group flex flex-col gap-2">
            <!--
            * @description 允许每行超出的最大宽度
            -->
            <label for="allow-over-weight-input" class="font-medium text-[#333] whitespace-nowrap"
              >允许超宽</label
            >
            <input
              id="allow-over-weight-input"
              type="number"
              v-model.number="editorStore.snOptions.score!.allowOverWeight"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              min="0"
            />
          </div>
          <!-- 显示和弦线 -->
          <div class="input-group flex flex-col gap-2">
            <!--
            * @description 是否显示和弦线
            -->
            <label for="show-chord-line-input" class="font-medium text-[#333] whitespace-nowrap"
              >显示和弦线</label
            >
            <select
              id="show-chord-line-input"
              v-model="editorStore.snOptions.score!.showChordLine"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
            >
              <option :value="true">开启</option>
              <option :value="false">关闭</option>
            </select>
          </div>
          <!-- 和弦线高度 -->
          <div class="input-group flex flex-col gap-2">
            <!--
            * @description 和弦线的高度
            -->
            <label for="chord-line-height-input" class="font-medium text-[#333] whitespace-nowrap"
              >和弦线高度</label
            >
            <input
              id="chord-line-height-input"
              type="number"
              v-model.number="editorStore.snOptions.score!.chordLineHeight"
              class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '../../stores';
import { SNScoreType, SNChordType } from 'simple-notation';

defineProps<{
  activePanel: string;
}>();

const emits = defineEmits(['toggle-accordion']);

const editorStore = useEditorStore();

const toggleAccordion = () => {
  emits('toggle-accordion', 'snOptions');
};
</script>
