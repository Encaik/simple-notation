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
import { ref, computed, watch } from 'vue';
import { usePianoRollStore } from '@/stores/pianoRoll';
import { storeToRefs } from 'pinia';

const timeline = ref<HTMLElement | null>(null);
const pianoRollStore = usePianoRollStore();
const { mode, bars, barWidth, beatsPerBar, tempo, rowHeight, scrollLeft } =
  storeToRefs(pianoRollStore);

const barLabels = computed(() => {
  const labels = [];
  if (mode.value === 'bar') {
    const minBarGap = 30;
    const barStep = Math.ceil(minBarGap / barWidth.value);
    for (let i = 0; i < bars.value; i += barStep) {
      const left = i * barWidth.value;
      labels.push({ left: left + 4, text: `${i + 1}` });
    }
    return labels;
  } else {
    const secondsPerBar = (60 / tempo.value) * beatsPerBar.value;
    for (let i = 0; i < bars.value; i++) {
      const time = i * secondsPerBar;
      labels.push({ left: i * barWidth.value + 4, text: `${time.toFixed(2)}s` });
    }
    return labels;
  }
});

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
