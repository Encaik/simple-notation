<template>
  <div
    ref="timeline"
    class="relative w-full overflow-x-auto overflow-y-hidden bg-gray-800 timeline-scrollbar-hide"
    :style="{ height: `${rowHeight}px` }"
  >
    <div
      class="relative"
      :style="{
        width: `${barWidth * bars}px`,
        height: `${rowHeight}px`,
      }"
    >
      <template v-for="(label, idx) in barLabels" :key="idx">
        <div
          class="absolute text-xs text-white px-1"
          :style="{
            left: `${label.left}px`,
            top: '0',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }"
        >
          {{ label.text }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePianoRoll } from '@/use';
import { ref, computed, watch } from 'vue';

/**
 * 时间线组件，显示钢琴卷帘顶部的小节号
 * @param bars 小节数
 * @param barWidth 每小节宽度
 * @param beatsPerBar 每小节拍数
 * @param rowHeight 行高（时间线高度）
 */
const props = defineProps({
  bars: { type: Number, default: 20 },
  barWidth: { type: Number, default: 160 },
  beatsPerBar: { type: Number, default: 4 },
  rowHeight: { type: Number, default: 24 },
});

const timeline = ref<HTMLElement | null>(null);

// 生成小节号标签
const barLabels = computed(() => {
  const labels = [];
  // 如果小节宽度太小，则隔几个小节显示一个标签
  const minBarGap = 30; // px，最小小节标签间距
  const barStep = Math.ceil(minBarGap / props.barWidth);

  for (let i = 0; i < props.bars; i += barStep) {
    const left = i * props.barWidth;
    // 小节号从1开始
    labels.push({ left: left + 4, text: `${i + 1}` });
  }
  return labels;
});

const { scrollLeft } = usePianoRoll();

watch(scrollLeft, (scrollLeft) => {
  if (!timeline.value) return;
  timeline.value.scrollLeft = scrollLeft;
});
</script>

<style scoped>
.timeline-scrollbar-hide {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.timeline-scrollbar-hide::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Webkit */
}
</style>
