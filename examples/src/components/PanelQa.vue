<template>
  <div class="qa-panel">
    <h3>🤔常见问题</h3>
    <div v-for="item in qaList" :key="item.question" class="qa-item">
      <h4>{{ item.question }}</h4>
      <p>{{ item.answer }}</p>
    </div>
    <!-- 可以根据需要添加更多 Q&A 项 -->
  </div>
</template>

<script setup lang="ts">
// 问答列表
const qaList = [
  {
    question: 'Q: 为什么采用换行的方式来确定一句的内容，而不是自动计算？',
    answer:
      'A: 换行的方式可以更清晰地展示歌词和简谱的对应关系，且目前处于初期阶段，计算方式比较容易影响功能实现，在基本功能完善后可以考虑添加自动计算。',
  },
  // 可以添加更多 Q&A 项
];
</script>
