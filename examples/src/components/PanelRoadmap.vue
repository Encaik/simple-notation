<template>
  <div
    class="max-w-[1200px] w-full mt-5 mx-auto bg-white bg-opacity-95 p-5 rounded-lg shadow-md flex flex-col gap-4 overflow-hidden box-border"
  >
    <h3 class="mb-[15px]">🛠️开发进度</h3>
    <div v-for="section in roadmapData" :key="section.title">
      <h4 class="mt-5 mb-2.5 border-b border-[#eee] pb-[5px]">
        {{ section.title }}
      </h4>
      <ul class="list-none p-0 m-0">
        <li
          v-for="item in section.items"
          :key="item.text"
          class="mb-2 pl-5 relative before:absolute before:left-0 before:content-['•'] before:text-orange-400"
          :class="{
            completed: item.completed,
            'before:content-[\'✓\'] before:text-green-600': item.completed,
          }"
        >
          {{ item.text }}
        </li>
      </ul>
    </div>
    <div>
      <p class="text-[#888] text-[13px] mt-1.5">
        💡 如果你有任何建议或问题，欢迎前往
        <a
          href="https://github.com/Encaik/simple-notation/issues"
          target="_blank"
          class="text-[#ff6b3d] underline"
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
      {
        text: '编辑工具，可以直接操作渲染界面修改文本，如：支持在渲染界面右键音符快捷添加和弦或其他符号',
        completed: false,
      },
    ],
  },
]);
</script>
