<template>
  <div class="piano-panel">
    <div class="piano">
      <!-- 白键 -->
      <div
        v-for="(key, i) in whiteKeys"
        :key="key.index"
        class="piano-key white"
        :class="{ active: activeKeys.includes(key.index) }"
        :style="getWhiteKeyStyle(i)"
        @click="handleKeyClick(key.note, key.index)"
      ></div>
      <!-- 黑键 -->
      <div
        v-for="key in blackKeys"
        :key="key.index"
        class="piano-key black"
        :class="{ active: activeKeys.includes(key.index) }"
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
 */
function highlightKeys(keyIndexes: number[]) {
  activeKeys.value = keyIndexes;
}

/**
 * 清除高亮
 */
function clearHighlight() {
  activeKeys.value = [];
}

defineExpose({ highlightKeys, clearHighlight, keys });

/**
 * 获取白键样式
 * @param {number} i - 白键在白键数组中的序号
 */
function getWhiteKeyStyle(i: number) {
  const whiteCount = whiteKeys.value.length;
  const keyWidth = 100 / whiteCount;
  return {
    width: `${keyWidth}%`,
    left: `${i * keyWidth}%`,
    height: '120px',
    zIndex: 1,
  };
}

/**
 * 获取黑键样式
 * @param {PianoKey} key
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
    height: '80px',
    zIndex: 2,
  };
}

const { playNote } = useTone();

/**
 * 播放指定音名的音符
 * @param {string} noteName
 */
async function handleKeyClick(noteName: string, keyIndex: number) {
  await playNote(noteName, 1.5);
  highlightKeys([keyIndex]);
  setTimeout(() => {
    clearHighlight();
  }, 1500);
}
</script>

<style scoped>
.piano-panel {
  max-width: 1200px;
  width: 100%;
  margin: 20px auto 0;
  /* 彩色渐变边框 */
  padding: 2.5px; /* 边框宽度 */
  border-radius: 12px;
  background: linear-gradient(135deg, #ff6b3d, #7b5aff);
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: row;
  gap: 16px;
  overflow: hidden;
  box-sizing: border-box;
}
.piano-panel > .piano {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 11px;
  overflow: hidden;
}
.piano {
  position: relative;
  height: 120px;
  width: 100%;
  user-select: none;
}
.piano-key {
  position: absolute;
  border: 1px solid #bbb;
  border-radius: 0 0 4px 4px;
  box-sizing: border-box;
  transition: background 0.1s;
}
.piano-key.white {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  top: 0;
  height: 100%;
  z-index: 1;
  border-right: 1px solid #eee;
}
.piano-key.black {
  background: #222;
  height: 80px;
  top: 0;
  border: 1px solid #444;
  margin-left: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  z-index: 2;
}
.piano-key.active.white {
  background: #ffe082;
}
.piano-key.active.black {
  background: #ffd54f;
}
</style>
