<template>
  <div
    class="flex-1 bg-white bg-opacity-95 p-5 rounded-lg shadow-md flex flex-col gap-4 overflow-hidden backdrop-blur-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
  >
    <div class="flex gap-2 mb-4 border-b border-[#ddd] pb-0">
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
    <template v-if="inputType === SNDataType.TEMPLATE && formData">
      <div class="grid grid-cols-3 gap-4 gap-x-6 flex-shrink-0">
        <h3 class="text-base font-medium text-[#333] mb-3 col-span-full">
          基本信息
        </h3>
        <div class="flex flex-col gap-2 min-w-0">
          <label
            for="title-input"
            class="font-medium text-[#333] whitespace-nowrap"
            >标题</label
          >
          <input
            type="text"
            id="title-input"
            :value="formData.info.title"
            @input="
              $emit('update:formData', {
                ...formData,
                info: {
                  ...formData.info,
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
            :value="formData.info.composer"
            @input="
              $emit('update:formData', {
                ...formData,
                info: {
                  ...formData.info,
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
            v-model="formData.info.lyricist"
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
            v-model="formData.info.time"
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
            v-model="formData.info.tempo"
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
            v-model="formData.info.key"
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
            v-model="formData.info.beat"
            placeholder="请输入节拍..."
            class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
          />
        </div>
      </div>
      <div class="flex flex-col gap-4 flex-1 min-h-0">
        <div class="flex flex-col gap-2 flex-1 min-h-0">
          <label
            for="score-input"
            class="font-medium text-[#333] whitespace-nowrap"
            >简谱：</label
          >
          <textarea
            id="score-input"
            :value="formData.score"
            @input="
              $emit('update:formData', {
                ...formData,
                score: ($event.target as HTMLTextAreaElement).value,
              })
            "
            placeholder="请输入简谱内容..."
            class="p-3 border border-[#ddd] rounded text-sm leading-normal resize-none flex-1 min-h-[150px] bg-white bg-opacity-80"
          ></textarea>
        </div>
        <div class="flex flex-col gap-2 flex-1 min-h-0">
          <label
            for="lyric-input"
            class="font-medium text-[#333] whitespace-nowrap"
            >歌词：</label
          >
          <textarea
            id="lyric-input"
            :value="formData.lyric"
            @input="
              $emit('update:formData', {
                ...formData,
                lyric: ($event.target as HTMLTextAreaElement).value,
              })
            "
            placeholder="请输入歌词内容..."
            class="p-3 border border-[#ddd] rounded text-sm leading-normal resize-none flex-1 min-h-[150px] bg-white bg-opacity-80"
          ></textarea>
        </div>
      </div>
    </template>
    <template v-else-if="inputType === SNDataType.ABC">
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { SNDataType, SNTemplate } from '../../../lib/src/types/sn';
/**
 * PanelEditor 组件 props
 * @typedef {Object} PanelEditorProps
 * @property {object=} formData - 默认模板数据
 * @property {SNDataType} inputType - 输入类型
 * @property {string=} abcStr - abc字符串
 */
defineProps<{
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
</script>
