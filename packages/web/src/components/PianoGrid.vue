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
      <div
        v-for="note in notes"
        :key="note.index"
        class="absolute bg-blue-400 rounded-sm opacity-80 cursor-pointer note-block"
        :style="getNoteStyle(note)"
      >
        <div class="px-1 text-xs text-white" style="line-height: 24px; user-select: none">
          {{ note.pitchName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePianoRoll } from '@/use';
import { computed, ref } from 'vue';

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

/**
 * 音符结构体
 * @typedef {Object} Note
 * @property {number} index 音符序号
 * @property {number} pitch 音高（MIDI）
 * @property {number} duration 持续时长（拍）
 */
interface Note {
  index: number;
  pitch: number;
  pitchName: string;
  start: number;
  duration: number;
}

let notes = ref<Note[]>([
  { index: 0, pitch: 60, pitchName: 'C4', start: 0, duration: 1 },
  { index: 1, pitch: 62, pitchName: 'D4', start: 1, duration: 1 },
  { index: 2, pitch: 64, pitchName: 'E4', start: 2, duration: 1 },
  { index: 3, pitch: 65, pitchName: 'F4', start: 3, duration: 1 },
  { index: 4, pitch: 67, pitchName: 'G4', start: 3, duration: 1 },
  { index: 5, pitch: 69, pitchName: 'A4', start: 4, duration: 1 },
  { index: 6, pitch: 71, pitchName: 'B4', start: 5, duration: 2 },
  { index: 7, pitch: 72, pitchName: 'C5', start: 6, duration: 1 },
  { index: 8, pitch: 74, pitchName: 'D5', start: 7, duration: 3 },
]);

/**
 * 计算音符块的样式
 * @param {Note} note 音符对象
 * @returns {object} 样式对象
 */
function getNoteStyle(note: Note) {
  const beatWidth = props.barWidth / props.beatsPerBar;
  const left = note.start * beatWidth;
  const width = note.duration * beatWidth - 1.5;
  const row = 108 - note.pitch;
  const top = row * props.rowHeight;
  const height = props.rowHeight - 1.5;
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    margin: '1px',
  };
}

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
