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
    <div
      v-if="activePanel === 'snOptions'"
      class="p-4 flex flex-col gap-5 overflow-y-auto min-h-0"
    >
      <div class="options-section border border-[#eee] p-[15px] rounded-md">
        <h3 class="mt-0 mb-[15px] text-[#555] text-lg">通用</h3>
        <div
          class="options-grid grid grid-cols-repeat-auto-fit minmax-150px-1fr gap-4 gap-x-6"
        >
          <div class="input-group flex flex-col gap-2">
            <label
              for="resize-input"
              class="font-medium text-[#333] whitespace-nowrap"
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
            <label
              for="debug-input"
              class="font-medium text-[#333] whitespace-nowrap"
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

      <div class="options-section border border-[#eee] p-[15px] rounded-md">
        <h3 class="mt-0 mb-[15px] text-[#555] text-lg">乐谱</h3>
        <div
          class="options-grid grid grid-cols-repeat-auto-fit minmax-150px-1fr gap-4 gap-x-6"
        >
          <div class="input-group flex flex-col gap-2">
            <label
              for="chord-type-input"
              class="font-medium text-[#333] whitespace-nowrap"
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
          <div class="input-group flex flex-col gap-2">
            <label
              for="score-type-input"
              class="font-medium text-[#333] whitespace-nowrap"
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '../../stores';
import { SNScoreType, SNChordType } from '@types';

defineProps<{
  activePanel: string;
}>();

const emits = defineEmits(['toggle-accordion']);

const editorStore = useEditorStore();

const toggleAccordion = () => {
  emits('toggle-accordion', 'snOptions');
};
</script>
