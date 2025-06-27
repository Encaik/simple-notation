<template>
  <div ref="scrollContainer" @scroll="onScroll" class="piano-grid-scrollbar-thick">
    <div ref="gridContainer" class="relative" :style="gridContainerStyle">
      <!-- 频谱图查看器 (z-0) -->
      <SpectrogramViewer
        v-if="pianoRollStore.audioBufferForSpectrogram"
        :width="barWidth * bars"
        :height="rows * rowHeight"
      />
      <!-- 网格线 (z-10) -->
      <GridViewer />
      <!-- 参考音符 (只读, z-20) -->
      <ReferenceNotesViewer />
      <!-- 音符 (z-20) -->
      <PianoRollNotesViewer />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTone } from '@/use';
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import {
  SpectrogramViewer,
  GridViewer,
  ReferenceNotesViewer,
  PianoRollNotesViewer,
} from '@/components';
import { usePianoRollStore } from '@/stores/pianoRoll';
import { storeToRefs } from 'pinia';

const { setInstrument } = useTone();
const pianoRollStore = usePianoRollStore();
const { barWidth, minimapWidth, bars, rowHeight, viewWidth, scrollLeft } =
  storeToRefs(pianoRollStore);

// #region 滚动处理
const scrollContainer = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (scrollContainer.value) {
    // 默认滚动到 C4 位置
    const C4_MIDI = 60;
    const C4_ROW_FROM_TOP = 108 - C4_MIDI;
    const c4YPosition = C4_ROW_FROM_TOP * rowHeight.value;

    // 使 C4 在视图中大致居中
    const containerHeight = scrollContainer.value.clientHeight;
    const initialScrollTop = c4YPosition - containerHeight / 2 + rowHeight.value / 2;
    scrollContainer.value.scrollTop = initialScrollTop;
  }
});

// 监听Minimap选区变化，实时同步主编辑区
watch(
  [() => pianoRollStore.minimapViewLeft, () => pianoRollStore.minimapViewWidth],
  ([viewLeft, viewWidthPx]) => {
    let newVisibleBars = (viewWidthPx / minimapWidth.value) * bars.value;
    newVisibleBars = Math.max(2, Math.min(bars.value, newVisibleBars));
    // 全宽时严格铺满，允许barWidth为小数，消除右侧空白
    if (Math.abs(viewWidthPx - minimapWidth.value) < 1) {
      barWidth.value = minimapWidth.value / bars.value;
      viewWidth.value = minimapWidth.value;
      scrollLeft.value = 0;
    } else {
      barWidth.value = Math.floor(minimapWidth.value / newVisibleBars);
      viewWidth.value = barWidth.value * newVisibleBars;
      let newScrollLeft = Math.round(
        (viewLeft / minimapWidth.value) * (barWidth.value * bars.value),
      );
      newScrollLeft = Math.max(
        0,
        Math.min(newScrollLeft, barWidth.value * bars.value - viewWidth.value),
      );
      scrollLeft.value = newScrollLeft;
    }
    nextTick(() => {
      if (scrollContainer.value) {
        scrollContainer.value.scrollLeft = scrollLeft.value;
      }
    });
  },
);

function onScroll(e: Event) {
  if (!e.target) return;
  const target = e.target as HTMLDivElement;
  pianoRollStore.setScrollTop(target.scrollTop);
  pianoRollStore.setScrollLeft(target.scrollLeft);

  // 同步更新Minimap选区
  const totalContentWidth = barWidth.value * bars.value;
  if (totalContentWidth > 0) {
    const minimapLeft = (target.scrollLeft / totalContentWidth) * pianoRollStore.minimapWidth;
    pianoRollStore.setMinimapView(minimapLeft, pianoRollStore.minimapViewWidth);
  }
}

// #endregion

// #region 编辑区样式
const rows = 88; // 固定88键
const BLACK_KEY_INDICES = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#
/**
 * 检查给定的行索引是否对应钢琴上的黑键。
 * @param rowIndex - 要检查的行索引 (0-87)。
 */
function isBlackKeyRow(rowIndex: number): boolean {
  // 钢琴最高音是 C8 (midi 108), 对应 grid 的 row 0.
  const midi = 108 - rowIndex;
  return BLACK_KEY_INDICES.includes(midi % 12);
}

const gridContainerStyle = computed(() => {
  const bgImages = [];
  const bgSizes = [];
  const bgPositions = [];
  const bgRepeats = [];
  for (let i = 0; i < rows; i++) {
    if (isBlackKeyRow(i)) {
      bgImages.push('linear-gradient(to right, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15))');
      bgSizes.push(`100% ${rowHeight.value}px`);
      bgPositions.push(`0 ${i * rowHeight.value}px`);
      bgRepeats.push('no-repeat');
    }
  }
  return {
    width: `${barWidth.value * bars.value}px`,
    height: `${rows * rowHeight.value}px`,
    backgroundImage: bgImages.join(', '),
    backgroundSize: bgSizes.join(', '),
    backgroundPosition: bgPositions.join(', '),
    backgroundRepeat: bgRepeats.join(', '),
  };
});

// #endregion

// #region 初始化
const gridContainer = ref<HTMLElement | null>(null);

onMounted(() => {
  setInstrument('piano');
  pianoRollStore.setGridContainer(gridContainer.value);
});

watch(gridContainer, (el) => {
  pianoRollStore.setGridContainer(el);
});

onBeforeUnmount(() => {
  pianoRollStore.setGridContainer(null);
});

// #endregion
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

.note-block {
  cursor: pointer;
  transition: background-color 0.2s;
}
.note-block:hover {
  background-color: #3b82f6; /* 更亮的蓝色 */
  cursor: grab;
}

/* 调整或拖动时，禁止 note 的 hover 效果 */
.is-resizing .note-block:hover,
.is-dragging .note-block:hover {
  background-color: #60a5fa; /* 保持原色 */
  cursor: inherit; /* 继承 body 的指针样式 */
}

.note-block.is-resizing {
  cursor: ew-resize !important;
}
</style>
