<template>
  <div class="absolute inset-0 z-10 pointer-events-none" :style="gridLinesStyle"></div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { usePianoRollStore } from '@/stores';
import { storeToRefs } from 'pinia';

const store = usePianoRollStore();
const { barWidth, beatsPerBar, quantization, rowHeight } = storeToRefs(store);

const gridLinesStyle = computed(() => {
  const beatWidth = (barWidth.value / beatsPerBar.value) * quantization.value;
  const bgImages = [
    `repeating-linear-gradient(to bottom, #6b7280 0, #6b7280 1px, transparent 1px, transparent ${rowHeight.value}px)`,
    `repeating-linear-gradient(to right, #6b7280 0, #6b7280 1px, transparent 1px, transparent ${beatWidth}px)`,
    `repeating-linear-gradient(to right, #9ca3af 0, #9ca3af 2px, transparent 2px, transparent ${barWidth.value}px)`,
  ];
  return {
    backgroundImage: bgImages.join(', '),
    backgroundSize: '100% 100%, 100% 100%, 100% 100%',
    backgroundPosition: '0 0, 0 0, 0 0',
    backgroundRepeat: 'repeat, repeat, repeat',
  };
});
</script>
