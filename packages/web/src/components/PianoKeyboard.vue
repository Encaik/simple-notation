<template>
  <div ref="pianoKeys" class="flex flex-col overflow-y-auto piano-keys-scrollbar-hide">
    <div
      v-for="key in [...keys].reverse()"
      :key="key.note + key.octave"
      :class="[
        'flex items-center px-2 text-xs border-b border-gray-500 w-full',
        key.isBlack ? 'bg-black text-white' : 'bg-white text-black',
      ]"
      style="user-select: none; min-height: 24px"
    >
      <span>{{ key.note + key.octave }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePianoRoll } from '@/use';
import { ref, watch } from 'vue';

// 生成88键数据，MIDI 21(A0)~108(C8)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const keys: any[] = [];
for (let midi = 21; midi <= 108; midi++) {
  const noteIndex = midi % 12;
  const note = NOTES[noteIndex];
  const octave = Math.floor(midi / 12) - 1;
  keys.push({
    note,
    octave,
    isBlack: note.includes('#'),
    midi,
  });
}

const { scrollTop } = usePianoRoll();
const pianoKeys = ref<HTMLElement | null>(null);

watch(scrollTop, (scrollTop) => {
  if (!pianoKeys.value) return;
  pianoKeys.value.scrollTop = scrollTop;
});
</script>

<style scoped>
.piano-keys-scrollbar-hide {
  padding: 24px 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.piano-keys-scrollbar-hide::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Webkit */
}
</style>
