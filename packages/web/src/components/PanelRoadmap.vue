<template>
  <div
    class="max-w-[1200px] w-full mt-5 mx-auto bg-white bg-opacity-95 p-5 rounded-lg shadow-md flex flex-col gap-4 overflow-hidden box-border hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
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
      { text: '文本配置渲染乐谱', completed: true },
      { text: '乐谱播放及光标动态谱', completed: true },
      { text: '乐谱导入导出功能', completed: true },
      { text: '播放可单独控制和弦与旋律', completed: true },
      { text: '播放升降调', completed: true },
      { text: '三种可交互乐器面板及对应播放高亮显示', completed: true },
      { text: '乐器面板对应的播放音色', completed: true },
      { text: '支持和弦符号', completed: true },
      { text: '支持和弦符号的和弦播放音色', completed: true },
      { text: '添加乐谱库，支持点击切换', completed: true },
      { text: '添加新建功能，一键创建新乐谱', completed: true },
      { text: '添加保存功能，支持保存为pdf', completed: true },
      { text: '添加播放时自动滚动功能', completed: true },
      { text: '支持链接midi设备，并在弹奏时高亮乐器面板', completed: true },
      { text: '添加音高检测面板', completed: true },
      { text: '添加音符选中逻辑，点击音符快速选中音符文本', completed: true },
      { text: '添加音符选中和渲染选区对应逻辑', completed: true },
      { text: '添加选中音符时邮件快捷面板，可以编辑音符文本', completed: true },
    ],
  },
  {
    title: '进行中',
    items: [
      { text: 'ABC 格式支持', completed: false },
      { text: '渲染效果优化', completed: false },
      { text: '支持反复符号及分段符号', completed: false },
      { text: '支持六线谱', completed: false },
      { text: '添加节拍器', completed: false },
      { text: '完善语法教程面板', completed: false },
      { text: '实现左手乐谱', completed: false },
    ],
  },
  {
    title: '待解决',
    items: [{ text: '多语言支持', completed: false }],
  },
]);
</script>
