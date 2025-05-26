<template>
  <div
    class="max-w-[1200px] w-full mt-5 mx-auto bg-white bg-opacity-95 p-5 rounded-lg shadow-md flex flex-col gap-5 overflow-y-auto box-border hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
  >
    <h3>⚙️SN渲染配置</h3>

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
            v-model="mutableOptions.resize"
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
            v-model="mutableOptions.debug"
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
            v-model="mutableOptions.score!.chordType"
            class="flex-1 p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80"
          >
            <option value="default">默认</option>
            <option value="guitar">吉他</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { SNOptions, SNScoreOptions } from '../../../lib/src/types/options';

/**
 * PanelSnOptions 组件 props
 * @typedef {Object} PanelSnOptionsProps
 * @property {Partial<SNOptions>} options - SimpleNotation 配置项对象
 */
const props = defineProps<{
  options: Partial<SNOptions>;
}>();

/**
 * PanelSnOptions emits
 * @event update:options - 当配置项对象变化时触发
 */
const emits = defineEmits(['update:options']);

// 定义默认的 score 配置，明确 chordType 的类型
const defaultScoreOptions: Pick<SNScoreOptions, 'chordType'> = {
  chordType: 'default',
};

// 创建一个 reactive 副本，并确保 score 嵌套对象存在并合并默认值
const mutableOptions = reactive<Partial<SNOptions>>({
  ...props.options,
  score: { ...defaultScoreOptions, ...(props.options?.score || {}) },
});

// 监听 mutableOptions 的变化，并触发 update:options 事件
watch(
  mutableOptions,
  (newOptions) => {
    emits('update:options', newOptions);
  },
  { deep: true },
);

// 监听原始 options prop 的变化，并更新 mutableOptions 副本
// 这确保当父组件直接更新 options prop 时，面板也能同步
watch(
  () => props.options,
  (newOptions) => {
    // 使用 Object.assign 更新 mutableOptions 的属性，并合并默认值
    // 先处理顶层属性
    Object.assign(mutableOptions, newOptions);

    // 确保 score 嵌套对象存在并合并其属性
    if (!mutableOptions.score) {
      mutableOptions.score = { ...defaultScoreOptions };
    } else {
      Object.assign(mutableOptions.score, {
        ...defaultScoreOptions,
        ...(newOptions?.score || {}),
      });
    }

    // 清除 mutableOptions 中在新 options 中不存在的顶层属性
    for (const key in mutableOptions) {
      if (!(key in newOptions) && key !== 'score') {
        // 不删除 score 属性
        delete mutableOptions[key as keyof Partial<SNOptions>];
      }
    }
  },
  { deep: true },
);
</script>
