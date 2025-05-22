<template>
  <div class="example-panel">
    <h3>简谱示例</h3>
    <div class="button-list">
      <button
        v-for="example in examples"
        :key="example.name"
        @click="handleClick(example.path, example.hasConf)"
      >
        {{ example.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';

// 示例列表
const examples = [
  { name: '小星星', path: '/score/小星星.json', hasConf: false },
  { name: '清明雨上', path: '/score/清明雨上.json', hasConf: false },
  { name: '功能测试', path: '/score/功能测试.json', hasConf: true },
  // 可以添加更多示例
];

const emits = defineEmits(['load-example']);

const handleClick = (path: string, hasConf: boolean) => {
  emits('load-example', path, hasConf);
};
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
</style>
