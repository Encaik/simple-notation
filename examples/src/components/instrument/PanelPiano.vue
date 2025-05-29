<template>
  <div
    class="max-w-[1200px] w-full mt-5 mx-auto p-[2.5px] rounded-xl bg-gradient-to-br from-[#ff6b3d] to-[#7b5aff] shadow-md flex flex-row gap-4 overflow-hidden box-border hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
  >
    <div
      ref="pianoContainer"
      class="relative h-[120px] w-full select-none bg-white bg-opacity-95 rounded-[11px] overflow-hidden"
      @mousedown="startDrag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
      @touchstart.passive="startDrag"
      @touchend="endDrag"
      @touchcancel="endDrag"
    >
      <!-- 白键 -->
      <div
        v-for="(key, i) in pianoStore.whiteKeys"
        :key="key.index"
        :data-key-index="key.index"
        class="absolute cursor-pointer border rounded-b-md box-border transition-colors duration-100 shadow-sm top-0 h-full z-10 border-r border-[#eee] white-key"
        :class="[
          pianoStore.highlightKeys.includes(key.midi) ||
          tempHighlightedKeys[key.midi]
            ? 'bg-[#ffe082]'
            : 'bg-white',
        ]"
        :style="getWhiteKeyStyle(i)"
        @click="handleKeyClick(key.note, key.midi)"
        @mouseover="handleKeyMouseOver(key.note, key.midi)"
      ></div>
      <!-- 黑键 -->
      <div
        v-for="key in pianoStore.blackKeys"
        :key="key.index"
        :data-key-index="key.index"
        class="absolute cursor-pointer border rounded-b-md box-border transition-colors duration-100 h-20 top-0 border-[#444] shadow-md z-20 black-key"
        :class="[
          pianoStore.highlightKeys.includes(key.midi) ||
          tempHighlightedKeys[key.midi]
            ? 'bg-[#ffd54f]'
            : 'bg-[#222]',
        ]"
        :style="getBlackKeyStyle(key)"
        @click.stop="handleKeyClick(key.note, key.midi)"
        @mouseover="handleKeyMouseOver(key.note, key.midi)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTone } from '../../use/useTone';
import { usePianoStore } from '../../stores';
import { PianoKey } from '../../model';

const pianoStore = usePianoStore();
const pianoContainer = ref<HTMLElement | null>(null);

// 88键钢琴的音名和黑白键分布
const keyPattern = [
  'A',
  'A#',
  'B',
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
];

// 生成88键数据
function generatePianoKeys(): PianoKey[] {
  const keys: PianoKey[] = [];
  let octave = 0;
  let noteIndex = 0;
  for (let i = 1; i <= 88; i++) {
    const noteName = keyPattern[noteIndex];
    let type: 'white' | 'black' = noteName.includes('#') ? 'black' : 'white';
    // 特殊处理A0, A#0, B0
    if (i <= 3) octave = 0;
    else octave = Math.floor((i - 4) / 12) + 1;
    keys.push({
      index: i,
      note: `${noteName}${octave}`,
      type,
      midi: i + 20,
    });
    noteIndex = (noteIndex + 1) % keyPattern.length;
  }
  return keys;
}

pianoStore.setKeys(generatePianoKeys());

const isDragging = ref(false);
const tempHighlightedKeys = ref<Record<number, boolean>>({});

// Add touchmove listener to window when component is mounted
onMounted(() => {
  window.addEventListener('touchmove', handleTouchMove, {
    passive: false,
  });
});

// Remove touchmove listener from window when component is unmounted
onUnmounted(() => {
  window.removeEventListener('touchmove', handleTouchMove);
});

/**
 * 获取白键样式
 * @param {number} i - 白键在白键数组中的序号
 * @returns {object}
 */
function getWhiteKeyStyle(i: number) {
  const whiteCount = pianoStore.whiteKeys.length;
  const keyWidth = 100 / whiteCount;
  return {
    width: `${keyWidth}%`,
    left: `${i * keyWidth}%`,
    height: '120px', // Keep height from original style
    zIndex: 1, // Keep zIndex from original style
  };
}

/**
 * 获取黑键样式
 * @param {PianoKey} key - 钢琴键对象
 * @returns {object}
 */
function getBlackKeyStyle(key: PianoKey) {
  // 找到黑键左侧的白键序号
  const idx = pianoStore.keys.findIndex((k) => k.index === key.index);
  // 黑键左侧的白键数量
  const leftWhiteCount = pianoStore.keys
    .slice(0, idx)
    .filter((k) => k.type === 'white').length;
  const whiteCount = pianoStore.whiteKeys.length;
  const keyWidth = 100 / whiteCount;
  // 黑键宽度为白键的60%
  return {
    width: `${keyWidth * 0.6}%`,
    left: `calc(${leftWhiteCount * keyWidth}% - ${keyWidth * 0.3}%)`,
    height: '80px', // Keep height from original style
    zIndex: 2, // Keep zIndex from original style
  };
}

const { playNote } = useTone();

/**
 * Handles click event on a piano key.
 * @param {string} noteName - The note name to play.
 * @param {number} midi - The midi of the key.
 * @returns {Promise<void>}
 */
async function handleKeyClick(noteName: string, midi: number) {
  if (isDragging.value) {
    return;
  }
  try {
    playNote(noteName, 1.5);
    pianoStore.setHighlightKeys([midi]);
    setTimeout(() => {
      pianoStore.clearHighlightKeys();
    }, 1500);
  } catch (error) {
    console.error('Error handling key click:', error);
  }
}

/**
 * Handles mouseover event on a piano key when dragging (for desktop).
 * Plays the note and sets a temporary highlight.
 * @param {string} noteName - The note name to play.
 * @param {number} midi - The midi of the key.
 * @returns {void}
 */
async function handleKeyMouseOver(noteName: string, midi: number) {
  if (isDragging.value) {
    try {
      playNote(noteName, 0.5);
      tempHighlightedKeys.value[midi] = true;
      setTimeout(() => {
        delete tempHighlightedKeys.value[midi];
      }, 200);
    } catch (error) {
      console.error('Error handling key mouseover:', error);
    }
  }
}

/**
 * Handles touchmove event on the window when dragging (for mobile).
 * Determines the element being touched and triggers playback/highlight if it's a piano key.
 * @param {TouchEvent} event - The touch event.
 * @returns {void}
 */
async function handleTouchMove(event: TouchEvent) {
  if (isDragging.value && event.touches.length > 0) {
    const touch = event.touches[0];
    const targetElement = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );

    if (
      targetElement &&
      (targetElement.classList.contains('white-key') ||
        targetElement.classList.contains('black-key'))
    ) {
      const keyIndex = parseInt(
        targetElement.getAttribute('data-key-index') || '-1',
        10,
      );
      if (keyIndex !== -1) {
        const key = pianoStore.keys.find((k) => k.index === keyIndex);
        if (key) {
          if (!tempHighlightedKeys.value[key.midi]) {
            try {
              playNote(key.note, 0.5);
              tempHighlightedKeys.value[key.midi] = true;
              setTimeout(() => {
                delete tempHighlightedKeys.value[key.midi];
              }, 200);
            } catch (error) {
              console.error('Error handling key touchmove:', error);
            }
          }
        }
      }
    }
  }
}

/**
 * Starts the dragging mode.
 * @param {MouseEvent | TouchEvent} event - The mouse or touch event.
 * @returns {void}
 */
function startDrag(event: MouseEvent | TouchEvent) {
  if (event.type.startsWith('touch')) {
    event.preventDefault();
  }
  isDragging.value = true;
  tempHighlightedKeys.value = {};
}

/**
 * Ends the dragging mode.
 * @returns {void}
 */
function endDrag() {
  isDragging.value = false;
  tempHighlightedKeys.value = {};
}
</script>
