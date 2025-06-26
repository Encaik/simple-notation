<template>
  <div ref="pianoKeys" class="flex flex-col piano-keys-scrollbar-hide" style="overflow-y: hidden">
    <div
      v-for="key in [...keys].reverse()"
      :key="key.note + key.octave"
      :class="[
        'flex items-center px-2 text-xs border-b border-gray-500 w-full',
        key.isBlack ? 'bg-black text-white' : 'bg-white text-black',
        isPressed(key) ? 'active-key' : '',
      ]"
      style="user-select: none; min-height: 24px"
      @mousedown="onKeyDown(key)"
      @mouseup="onKeyUp(key)"
      @mouseleave="onKeyUp(key)"
    >
      <span>{{ key.note + key.octave }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePianoRoll } from '@/use';
import { ref, watch } from 'vue';
import { useTone } from '@/use';

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

// 当前按下的键（用于高亮）
const pressedKey = ref<{ note: string; octave: number } | null>(null);

// 播放音高的方法
const { playNote } = useTone();

/**
 * 判断某个键是否被按下
 * @param key 按键对象
 * @returns 是否按下
 */
function isPressed(key: { note: string; octave: number }) {
  return (
    pressedKey.value && pressedKey.value.note === key.note && pressedKey.value.octave === key.octave
  );
}

/**
 * 鼠标按下时播放音高并高亮
 * @param key 按键对象
 */
function onKeyDown(key: { note: string; octave: number }) {
  pressedKey.value = { note: key.note, octave: key.octave };
  playNote(`${key.note}${key.octave}`);
}

/**
 * 鼠标松开或移出时取消高亮
 * @param key 按键对象
 */
function onKeyUp(key?: { note: string; octave: number }) {
  pressedKey.value = null;
}

watch(scrollTop, (scrollTop) => {
  if (!pianoKeys.value) return;
  pianoKeys.value.scrollTop = scrollTop;
});
</script>

<style scoped>
.piano-keys-scrollbar-hide {
  padding: 68.8px 0 24px 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.piano-keys-scrollbar-hide::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Webkit */
}

/* 统一高亮样式，黑白键都用半透明黄色，参考PanelPiano */
.active-key {
  background: rgba(255, 224, 130, 0.85) !important;
  color: #222 !important;
  box-shadow:
    0 0 8px 2px rgba(255, 193, 7, 0.18),
    0 2px 8px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}
</style>
