<template>
  <div>
    <div
      v-for="note in referenceNotes"
      :key="'ref-' + note.index"
      class="absolute bg-teal-700 rounded-sm opacity-60 pointer-events-none z-20"
      :style="getNoteStyle(note)"
    >
      <div class="px-1 text-xs text-white" style="line-height: 24px; user-select: none">
        {{ note.pitchName }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Note } from '@/model';
import { usePianoRollStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const store = usePianoRollStore();
const { referenceNotes, barWidth, beatsPerBar, mp3Offset, rowHeight } = storeToRefs(store);

const oneBeatWidth = computed(() => barWidth.value / beatsPerBar.value);

/**
 * 计算音符块的样式
 * @param {Note} note 音符对象
 * @returns {object} 样式对象
 */
function getNoteStyle(note: Note) {
  const start = note.start - mp3Offset.value;
  const left = Math.max(0, start * oneBeatWidth.value);
  const width = note.duration * oneBeatWidth.value - 1.5;
  const row = 108 - note.pitch;
  const top = row * rowHeight.value;
  const height = rowHeight.value - 1.5;
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    margin: '1px',
  };
}
</script>
