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
      <template v-for="(label, idx) in timeLabels" :key="idx">
        <div
          class="absolute text-xs text-white px-1"
          :style="{
            left: `${label.left}px`,
            top: '0',
            whiteSpace: 'nowrap',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '2px',
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
 * 时间线组件，显示钢琴卷帘顶部的时间刻度
 * @param bars 小节数
 * @param barWidth 每小节宽度
 * @param beatsPerBar 每小节拍数
 * @param tempo 每分钟节拍数（BPM）
 * @param rowHeight 行高（时间线高度）
 */
const props = defineProps({
  bars: { type: Number, default: 20 },
  barWidth: { type: Number, default: 160 },
  beatsPerBar: { type: Number, default: 4 },
  tempo: { type: Number, default: 60 }, // BPM
  rowHeight: { type: Number, default: 24 },
});

const timeline = ref<HTMLElement | null>(null);

// 计算每拍的毫秒数
const msPerBeat = computed(() => 60000 / props.tempo);

// 生成时间标签，防止重叠
const timeLabels = computed(() => {
  const labels = [];
  const totalBeats = props.bars * props.beatsPerBar;
  const minLabelGap = 48; // px，最小间隔，防止重叠
  let lastLeft = -Infinity;

  for (let i = 0; i <= totalBeats; i++) {
    const left = (i * props.barWidth) / props.beatsPerBar;
    if (left - lastLeft < minLabelGap && i !== 0) continue;
    lastLeft = left;

    const ms = Math.round(i * msPerBeat.value);
    // 格式化为 mm:ss.SSS
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const msStr = String(ms % 1000).padStart(3, '0');
    const text = `${min}:${String(sec).padStart(2, '0')}.${msStr}`;
    labels.push({ left, text });
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
