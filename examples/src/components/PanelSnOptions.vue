<template>
  <div class="sn-options-panel">
    <h3>⚙️SN渲染配置</h3>

    <div class="options-section">
      <h3>通用</h3>
      <div class="options-grid">
        <div class="input-group">
          <label for="resize-input">自适应</label>
          <select id="resize-input" v-model="mutableOptions.resize">
            <option :value="true">开启</option>
            <option :value="false">关闭</option>
          </select>
        </div>
        <div class="input-group">
          <label for="debug-input">Debug 模式</label>
          <select id="debug-input" v-model="mutableOptions.debug">
            <option :value="true">开启</option>
            <option :value="false">关闭</option>
          </select>
        </div>
      </div>
    </div>

    <div class="options-section">
      <h3>乐谱</h3>
      <div class="options-grid">
        <div class="input-group">
          <label for="chord-type-input">和弦显示类型</label>
          <select
            id="chord-type-input"
            v-model="mutableOptions.score!.chordType"
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

<style scoped>
.sn-options-panel {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 8px;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto; /* Add scroll for overflow content */
}

.options-section {
  border: 1px solid #eee;
  padding: 15px;
  border-radius: 4px;
}

.options-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #555;
  font-size: 18px;
}

/* Add grid styles for options-grid */
.options-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(150px, 1fr)
  ); /* Flexible columns, min width 150px */
  gap: 16px 24px; /* Gap between grid items */
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.input-group input[type='number'],
.input-group select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
}
</style>
