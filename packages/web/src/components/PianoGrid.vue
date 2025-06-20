<template>
  <div @scroll="onScroll" class="piano-grid-scrollbar-thick">
    <div
      class="relative"
      :style="{
        background: gridBg,
        width: `${props.barWidth * props.bars}px`,
        height: `${props.rows * props.rowHeight}px`,
      }"
    >
      <!-- 未来每个音符都是绝对定位小div -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePianoRoll } from '@/use';
import { computed } from 'vue';

const props = defineProps({
  beatsPerBar: { type: Number, default: 4 },
  bars: { type: Number, default: 20 },
  barWidth: { type: Number, default: 160 },
  rows: { type: Number, default: 88 },
  rowHeight: { type: Number, default: 24 },
});

const gridBg = computed(() => {
  const { beatsPerBar, barWidth, rowHeight } = props;
  const beatWidth = barWidth / beatsPerBar;
  // 横线
  const horizontal = `repeating-linear-gradient(
    to bottom,
    #6b7280 0, #6b7280 1px,
    transparent 1px, transparent ${rowHeight}px
  )`;
  // 竖线（细线和粗线）
  const vertical = `
    repeating-linear-gradient(
      to right,
      #6b7280 0, #6b7280 1px,
      transparent 1px, transparent ${beatWidth}px
    ),
    repeating-linear-gradient(
      to right,
      #9ca3af 0, #9ca3af 2px,
      transparent 2px, transparent ${barWidth}px
    )
  `;
  return `${horizontal},${vertical}`;
});

const { setScrollTop, setScrollLeft } = usePianoRoll();

function onScroll(e: Event) {
  if (!e.target) return;
  const target = e.target as HTMLDivElement;
  setScrollTop(target.scrollTop);
  setScrollLeft(target.scrollLeft);
}
</script>

<style scoped>
.piano-grid-scrollbar-thick {
  scrollbar-width: auto;
  scrollbar-color: #a3a3a3 transparent;
}
.piano-grid-scrollbar-thick::-webkit-scrollbar {
  width: 24px;
  height: 24px;
}
.piano-grid-scrollbar-thick::-webkit-scrollbar-track {
  background: transparent;
}
.piano-grid-scrollbar-thick::-webkit-scrollbar-thumb {
  background: #a3a3a3;
  border-radius: 0;
}
</style>
