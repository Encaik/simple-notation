<template>
  <div class="minimap-container" ref="container" :style="{ width: minimapWidth + 'px' }">
    <!-- 缩略区背景（简化网格） -->
    <div class="minimap-bg">
      <div
        v-for="i in bars"
        :key="i"
        class="minimap-bar"
        :style="{ left: `${(i - 1) * barMiniWidth}px`, width: `${barMiniWidth - 1}px` }"
      ></div>
    </div>
    <!-- 可拖动缩放的选区 -->
    <div class="minimap-selection" :style="selectionStyle" @mousedown="onSelectionMouseDown">
      <!-- 左右拉伸手柄 -->
      <div class="resize-handle left" @mousedown.stop="onResizeMouseDown('left', $event)"></div>
      <div class="resize-handle right" @mousedown.stop="onResizeMouseDown('right', $event)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePianoRollStore } from '@/stores/pianoRoll';
import { storeToRefs } from 'pinia';

const pianoRollStore = usePianoRollStore();
const { bars, minimapWidth, minimapViewLeft, minimapViewWidth } = storeToRefs(pianoRollStore);

const container = ref<HTMLElement | null>(null);

const selectionStyle = computed(() => ({
  left: `${minimapViewLeft.value}px`,
  width: `${minimapViewWidth.value}px`,
  height: '100%',
}));

const barMiniWidth = computed(() => minimapWidth.value / bars.value);

const dragState = ref<{
  type: 'move' | 'resize-left' | 'resize-right' | null;
  startX: number;
  startLeft: number;
  startWidth: number;
} | null>(null);

function onSelectionMouseDown(e: MouseEvent) {
  pianoRollStore.setIsMinimapDragging(true);
  dragState.value = {
    type: 'move',
    startX: e.clientX,
    startLeft: pianoRollStore.minimapViewLeft,
    startWidth: pianoRollStore.minimapViewWidth,
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onResizeMouseDown(direction: 'left' | 'right', e: MouseEvent) {
  pianoRollStore.setIsMinimapDragging(true);
  dragState.value = {
    type: direction === 'left' ? 'resize-left' : 'resize-right',
    startX: e.clientX,
    startLeft: pianoRollStore.minimapViewLeft,
    startWidth: pianoRollStore.minimapViewWidth,
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e: MouseEvent) {
  if (!dragState.value) return;
  const dx = e.clientX - dragState.value.startX;
  let newLeft = dragState.value.startLeft;
  let newWidth = dragState.value.startWidth;
  const minWidth = 80;
  const maxLeft = minimapWidth.value - minWidth;

  if (dragState.value.type === 'move') {
    newLeft = Math.min(Math.max(0, dragState.value.startLeft + dx), minimapWidth.value - newWidth);
  } else if (dragState.value.type === 'resize-left') {
    newLeft = Math.min(
      Math.max(0, dragState.value.startLeft + dx),
      dragState.value.startLeft + dragState.value.startWidth - minWidth,
    );
    newWidth = dragState.value.startWidth + (dragState.value.startLeft - newLeft);
  } else if (dragState.value.type === 'resize-right') {
    newWidth = Math.max(minWidth, dragState.value.startWidth + dx);
    if (newLeft + newWidth > minimapWidth.value) {
      newWidth = minimapWidth.value - newLeft;
    }
  }
  // 实时更新store，保证选区和鼠标同步
  pianoRollStore.setMinimapView(newLeft, newWidth);
}

function onMouseUp() {
  dragState.value = null;
  pianoRollStore.setIsMinimapDragging(false);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}
</script>

<style scoped>
.minimap-container {
  position: relative;
  width: 100%;
  height: 40px;
  background: #222;
  border-radius: 6px;
  overflow: hidden;
  user-select: none;
}
.minimap-bg {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  z-index: 1;
  display: flex;
}
.minimap-bar {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.08);
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}
.minimap-selection {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(255, 224, 130, 0.35);
  border: 2px solid #ffe082;
  border-radius: 4px;
  z-index: 2;
  cursor: grab;
  transition:
    left 0.1s,
    width 0.1s;
  box-shadow: 0 0 8px 2px rgba(255, 193, 7, 0.12);
  display: flex;
  align-items: center;
}
.resize-handle {
  width: 8px;
  height: 70%;
  background: rgba(255, 224, 130, 0.7);
  border-radius: 2px;
  position: absolute;
  top: 15%;
  cursor: ew-resize;
  z-index: 3;
}
.resize-handle.left {
  left: -4px;
}
.resize-handle.right {
  right: -4px;
}
</style>
