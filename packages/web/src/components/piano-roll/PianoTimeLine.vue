<template>
  <div
    ref="timeline"
    class="relative w-full bg-gray-800 timeline-scrollbar-hide"
    :style="{ height: `${rowHeight}px`, overflowX: 'hidden' }"
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
import { usePianoRollStore } from '@/stores/pianoRoll';

/**
 * 时间线组件，支持小节模式和时间线模式
 * @param bars 小节数
 * @param barWidth 每小节宽度
 * @param beatsPerBar 每小节拍数
 * @param rowHeight 行高（时间线高度）
 * @param mode 模式（'bar' | 'time'）
 */
const props = defineProps({
  bars: { type: Number, default: 20 },
  barWidth: { type: Number, default: 160 },
  beatsPerBar: { type: Number, default: 4 },
  rowHeight: { type: Number, default: 24 },
  mode: { type: String, default: 'bar' }, // 'bar' | 'time'
  // tempo参数已移除，直接用store
});

const timeline = ref<HTMLElement | null>(null);
const pianoRollStore = usePianoRollStore(); // 直接获取全局tempo

/**
 * 生成时间线标签（小节号或时间刻度）
 */
const barLabels = computed(() => {
  const labels = [];
  // 小节模式：显示小节号
  if (props.mode === 'bar') {
    const minBarGap = 30; // px，最小小节标签间距
    const barStep = Math.ceil(minBarGap / pianoRollStore.barWidth);
    for (let i = 0; i < pianoRollStore.bars; i += barStep) {
      const left = i * pianoRollStore.barWidth;
      labels.push({ left: left + 4, text: `${i + 1}` });
    }
    return labels;
  }
  // time模式：每小节起始时间点
  const secondsPerBar = (60 / pianoRollStore.tempo) * pianoRollStore.beatsPerBar;
  for (let i = 0; i < pianoRollStore.bars; i++) {
    const time = i * secondsPerBar;
    labels.push({ left: i * pianoRollStore.barWidth + 4, text: `${time.toFixed(2)}s` });
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
