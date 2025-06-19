<template>
  <div class="flex flex-col">
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
// 生成88键数据
const NOTES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
const keys: any[] = [];
let octave = 0;
for (let i = 0, n = 21; i < 88; i++, n++) {
  // MIDI 21 = A0
  const noteIndex = n % 12;
  const note = NOTES[noteIndex];
  if (note === 'C') octave++;
  keys.push({
    note,
    octave,
    isBlack: note.includes('#'),
  });
}
</script>
