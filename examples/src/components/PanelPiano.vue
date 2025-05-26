<template>
  <div
    class="max-w-[1200px] w-full mt-5 mx-auto p-[2.5px] rounded-xl bg-gradient-to-br from-[#ff6b3d] to-[#7b5aff] shadow-md flex flex-row gap-4 overflow-hidden box-border"
  >
    <div
      class="relative h-[120px] w-full select-none bg-white bg-opacity-95 rounded-[11px] overflow-hidden"
    >
      <!-- 白键 -->
      <div
        v-for="(key, i) in whiteKeys"
        :key="key.index"
        class="absolute border border-[#bbb] rounded-b-md box-border transition-colors duration-100 bg-white shadow-sm top-0 h-full z-10 border-r border-[#eee]"
        :class="{ 'bg-[#ffe082]': activeKeys.includes(key.index) }"
        :style="getWhiteKeyStyle(i)"
        @click="handleKeyClick(key.note, key.index)"
      ></div>
      <!-- 黑键 -->
      <div
        v-for="key in blackKeys"
        :key="key.index"
        class="absolute border border-[#bbb] rounded-b-md box-border transition-colors duration-100 bg-[#222] h-20 top-0 border-[#444] shadow-md z-20"
        :class="{ 'bg-[#ffd54f]': activeKeys.includes(key.index) }"
        :style="getBlackKeyStyle(key)"
        @click.stop="handleKeyClick(key.note, key.index)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineExpose } from 'vue';
import { useTone } from '../use/useTone';

/**
 * 钢琴键数据结构
 */
interface PianoKey {
  index: number; // 1-88
  note: string; // 如A0, C4
  type: 'white' | 'black';
}

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
    });
    noteIndex = (noteIndex + 1) % keyPattern.length;
  }
  return keys;
}

const keys = generatePianoKeys();
const activeKeys = ref<number[]>([]);

// 白键和黑键分组
const whiteKeys = computed(() => keys.filter((k) => k.type === 'white'));
const blackKeys = computed(() => keys.filter((k) => k.type === 'black'));

/**
 * 高亮指定的钢琴键
 * @param {number[]} keyIndexes - 需要高亮的键的索引数组（1-88）
 * @returns {void}
 */
function highlightKeys(keyIndexes: number[]) {
  activeKeys.value = keyIndexes;
}

/**
 * 清除高亮
 * @returns {void}
 */
function clearHighlight() {
  activeKeys.value = [];
}

defineExpose({ highlightKeys, clearHighlight, keys });

/**
 * 获取白键样式
 * @param {number} i - 白键在白键数组中的序号
 * @returns {object}
 */
function getWhiteKeyStyle(i: number) {
  const whiteCount = whiteKeys.value.length;
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
  const idx = keys.findIndex((k) => k.index === key.index);
  // 黑键左侧的白键数量
  const leftWhiteCount = keys
    .slice(0, idx)
    .filter((k) => k.type === 'white').length;
  const whiteCount = whiteKeys.value.length;
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
 * 播放指定音名的音符
 * @param {string} noteName - 音名
 * @param {number} keyIndex - 键索引
 * @returns {Promise<void>}
 */
async function handleKeyClick(noteName: string, keyIndex: number) {
  await playNote(noteName, 1.5);
  highlightKeys([keyIndex]);
  setTimeout(() => {
    clearHighlight();
  }, 1500);
}
</script>
