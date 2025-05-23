<template>
  <div class="example-panel">
    <h3>🎵简谱示例</h3>
    <div class="filter-bar">
      <div class="input-group" style="margin-bottom: 0; min-width: 120px">
        <label for="filter-name">乐谱名称：</label>
        <input
          id="filter-name"
          v-model="filterName"
          type="text"
          placeholder="请输入乐谱名称..."
          @input="onFilterInput"
        />
      </div>
      <div class="input-group" style="margin-bottom: 0; min-width: 120px">
        <label for="filter-type">模板类型：</label>
        <select id="filter-type" v-model="filterType" @change="onFilterInput">
          <option value="">全部类型</option>
          <option :value="SNDataType.TEMPLATE">模板</option>
          <option :value="SNDataType.ABC">abc</option>
        </select>
      </div>
      <button class="filter-reset" @click="resetFilter">重置</button>
    </div>
    <div class="button-list">
      <button
        v-for="example in filteredExamples"
        :key="example.name"
        @click="handleClick(example.path, example.hasConf, example.type)"
        class="example-btn"
        style="position: relative"
      >
        {{ example.name }}
        <!-- abc类型角标 -->
        <span v-if="example.type === SNDataType.ABC" class="abc-badge-triangle">
          <span class="abc-badge-text">a</span>
        </span>
      </button>
    </div>
    <div class="ps-content">
      <p style="color: #888; font-size: 13px; margin-top: 6px">
        🎶 如果你有自制的曲谱，欢迎前往
        <a
          href="https://github.com/Encaik/simple-notation/issues/2"
          target="_blank"
          style="color: #ff6b3d; text-decoration: underline"
          >曲谱分享区</a
        >
        秀一秀你的作品，说不定下一个"曲库之星"就是你！😉
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SNDataType } from '@types';
import { defineEmits, ref, computed } from 'vue';

// 示例列表
const examples = [
  {
    name: '小星星',
    path: '/score/template/小星星.json',
    hasConf: false,
    type: SNDataType.TEMPLATE,
  },
  {
    name: '清明雨上',
    path: '/score/template/清明雨上.json',
    hasConf: false,
    type: SNDataType.TEMPLATE,
  },
  {
    name: '功能测试',
    path: '/score/template/功能测试.json',
    hasConf: true,
    type: SNDataType.TEMPLATE,
  },
  {
    name: "Cooley's",
    path: "/score/abc/Cooley's.txt",
    hasConf: false,
    type: SNDataType.ABC,
  },
  // 可以添加更多示例
];

const emits = defineEmits(['load-example']);

const handleClick = (path: string, hasConf: boolean, type: SNDataType) => {
  emits('load-example', path, hasConf, type);
};

// 筛选相关状态
const filterName = ref('');
const filterType = ref('');

// 防抖处理
let filterTimer: number | null = null;
const onFilterInput = () => {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = window.setTimeout(() => {
    filterTimer = null;
    // 触发筛选，computed会自动更新
  }, 200);
};

const resetFilter = () => {
  filterName.value = '';
  filterType.value = '';
};

// 计算筛选后的示例
const filteredExamples = computed(() => {
  return examples.filter((ex) => {
    const matchName = !filterName.value || ex.name.includes(filterName.value);
    const matchType = !filterType.value || ex.type === filterType.value;
    return matchName && matchType;
  });
});
</script>

<style scoped>
.button-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px; /* 按钮之间的间距 */
}

.example-panel button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  min-height: auto;
  box-sizing: border-box;
}

.example-panel button:focus {
  outline: none;
  border-color: #ff6b3d;
  box-shadow: 0 0 0 2px rgba(255, 107, 61, 0.1);
}

.example-panel button:hover {
  background: rgba(255, 255, 255, 0.9);
}

/* 右下角三角形角标 */
.abc-badge-triangle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 0;
  height: 0;
  border-bottom: 15px solid #ff6b3d; /* 三角形高度 */
  border-left: 15px solid transparent; /* 三角形宽度 */
  z-index: 1;
  pointer-events: none;
}

.abc-badge-text {
  position: absolute;
  right: 0px;
  bottom: -15px;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  z-index: 2;
  pointer-events: none;
  white-space: nowrap;
}

.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 12px;
}

.filter-bar .input-group {
  margin-bottom: 0;
  min-width: 120px;
}

.filter-bar input,
.filter-bar select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
}

.filter-bar label {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  margin-bottom: 4px;
}

.filter-reset {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  background: #fff;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.filter-reset:hover {
  background: #f0f0f0;
}
</style>
