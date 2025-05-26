<template>
  <div class="roadmap-panel">
    <h3>🛠️开发进度</h3>
    <div v-for="section in roadmapData" :key="section.title">
      <h4>{{ section.title }}</h4>
      <ul>
        <li
          v-for="item in section.items"
          :key="item.text"
          :class="{ completed: item.completed }"
        >
          {{ item.text }}
        </li>
      </ul>
    </div>
    <div class="ps-content">
      <p style="color: #888; font-size: 13px; margin-top: 6px">
        💡 如果你有任何建议或问题，欢迎前往
        <a
          href="https://github.com/Encaik/simple-notation/issues"
          target="_blank"
          style="color: #ff6b3d; text-decoration: underline"
          >Issues</a
        >
        反馈问题或提出建议，让我们一起打造更好的乐谱编辑工具！
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface RoadmapItem {
  text: string;
  completed: boolean;
}

interface RoadmapSection {
  title: string;
  items: RoadmapItem[];
}

const roadmapData = ref<RoadmapSection[]>([
  {
    title: '已完成',
    items: [
      { text: '基础乐谱编辑展示功能', completed: true },
      { text: '乐谱播放功能', completed: true },
      { text: '乐谱导入导出功能', completed: true },
    ],
  },
  {
    title: '进行中',
    items: [
      { text: 'ABC 格式支持', completed: false },
      { text: '渲染效果优化', completed: false },
      {
        text: '符号功能扩充，如换气符号，循环分段符号及相关逻辑',
        completed: false,
      },
      { text: '播放时音高考虑调号', completed: false },
    ],
  },
  {
    title: '待解决',
    items: [
      { text: '打印时符号显示问题', completed: false },
      { text: '多语言支持', completed: false },
      { text: '输入音符时演奏钢琴，可以校验音符是否正确', completed: false },
      { text: '节拍器', completed: false },
      { text: '支持midi设备连接，允许弹奏的方式输入', completed: false },
    ],
  },
]);
</script>

<style scoped>
.roadmap-panel h3 {
  margin-bottom: 15px;
}

.roadmap-panel h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.roadmap-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.roadmap-panel li {
  margin-bottom: 8px;
  padding-left: 20px;
  position: relative;
}

.roadmap-panel li::before {
  content: '•'; /* Or use a checkmark/box icon */
  position: absolute;
  left: 0;
  color: #42b983; /* Example color for completed items */
}

.roadmap-panel li.completed::before {
  content: '✓';
  color: green;
}

.roadmap-panel li:not(.completed)::before {
  content: '•';
  color: orange;
}
</style>
