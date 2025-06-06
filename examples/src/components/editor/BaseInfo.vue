<template>
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
      @click="toggleAccordion"
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
          :value="editorStore.formData.info.title"
          @input="
            updateInfo('title', ($event.target as HTMLInputElement).value)
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
          :value="editorStore.formData.info.composer"
          @input="
            updateInfo('composer', ($event.target as HTMLInputElement).value)
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
          :value="editorStore.formData.info.lyricist"
          @input="
            updateInfo('lyricist', ($event.target as HTMLInputElement).value)
          "
          placeholder="请输入作词..."
          class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
        />
      </div>
      <div class="flex flex-col gap-2 min-w-0">
        <label
          for="author-input"
          class="font-medium text-[#333] whitespace-nowrap"
          >作谱</label
        >
        <input
          type="text"
          id="author-input"
          :value="editorStore.formData.info.author"
          @input="
            updateInfo('author', ($event.target as HTMLInputElement).value)
          "
          placeholder="请输入作谱..."
          class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
        />
      </div>
      <div class="flex flex-col gap-2 min-w-0">
        <label
          for="beat-input"
          class="font-medium text-[#333] whitespace-nowrap"
          >拍数</label
        >
        <input
          type="text"
          id="beat-input"
          :value="editorStore.formData.info.beat"
          @input="updateInfo('beat', ($event.target as HTMLInputElement).value)"
          placeholder="请输入每小节几拍..."
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
          :value="editorStore.formData.info.time"
          @input="updateInfo('time', ($event.target as HTMLInputElement).value)"
          placeholder="请输入以几分音符为一拍..."
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
          :value="editorStore.formData.info.tempo"
          @input="
            updateInfo('tempo', ($event.target as HTMLInputElement).value)
          "
          placeholder="请输入速度..."
          class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
        />
      </div>
      <div class="flex flex-col gap-2 min-w-0">
        <label for="key-input" class="font-medium text-[#333] whitespace-nowrap"
          >调号</label
        >
        <select
          id="key-input"
          :value="editorStore.formData.info.key"
          @input="updateInfo('key', ($event.target as HTMLSelectElement).value)"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '../../stores';
import { SNTemplateKey, SNAbcKey } from '../../../../lib/src/types/sn';

defineProps<{
  activePanel: string;
}>();

const emits = defineEmits(['toggle-accordion']);

const editorStore = useEditorStore();

const toggleAccordion = () => {
  emits('toggle-accordion', 'basicInfo');
};

function updateInfo(
  key: keyof typeof editorStore.formData.info,
  value: string,
) {
  if (editorStore.formData) {
    if (key === 'key') {
      editorStore.formData.info[key] = value as SNTemplateKey | SNAbcKey;
    } else if (key === 'time' || key === 'tempo' || key === 'beat') {
      // 这些字段应该是数字字符串
      editorStore.formData.info[key] = value.replace(/[^\d]/g, '');
    } else {
      // 其他字段（title, composer, lyricist）直接更新
      editorStore.formData.info[key] = value;
    }
  }
}
</script>
