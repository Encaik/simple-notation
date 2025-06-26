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
import { ref, computed, watch } from 'vue';

/**
 * Minimap组件props
 * @param bars 小节数
 * @param minimapWidth Minimap总宽度（像素）
 * @param viewLeft 选区左侧像素
 * @param viewWidth 选区宽度像素
 */
const props = defineProps({
  bars: { type: Number, required: true },
  minimapWidth: { type: Number, required: true },
  viewLeft: { type: Number, required: true },
  viewWidth: { type: Number, required: true },
});

const emit = defineEmits<{
  (e: 'updateView', left: number, width: number): void;
}>();

const container = ref<HTMLElement | null>(null);

// 本地选区状态，拖动/缩放时优先用本地状态渲染，非拖动时同步props
const localViewLeft = ref(props.viewLeft);
const localViewWidth = ref(props.viewWidth);

// 监听props变化，非拖动时同步本地状态
watch(
  () => [props.viewLeft, props.viewWidth],
  ([newLeft, newWidth]) => {
    if (!dragState.value) {
      localViewLeft.value = newLeft;
      localViewWidth.value = newWidth;
    }
  },
);

// 选区样式
const selectionStyle = computed(() => ({
  left: `${localViewLeft.value}px`,
  width: `${localViewWidth.value}px`,
  height: '100%',
}));

// 缩略条宽度（均分）
const barMiniWidth = computed(() => props.minimapWidth / props.bars);

// 拖动/缩放状态
const dragState = ref<{
  type: 'move' | 'resize-left' | 'resize-right' | null;
  startX: number;
  startLeft: number;
  startWidth: number;
} | null>(null);

/**
 * 拖动选区
 */
function onSelectionMouseDown(e: MouseEvent) {
  dragState.value = {
    type: 'move',
    startX: e.clientX,
    startLeft: localViewLeft.value,
    startWidth: localViewWidth.value,
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

/**
 * 拉伸选区
 */
function onResizeMouseDown(direction: 'left' | 'right', e: MouseEvent) {
  dragState.value = {
    type: direction === 'left' ? 'resize-left' : 'resize-right',
    startX: e.clientX,
    startLeft: localViewLeft.value,
    startWidth: localViewWidth.value,
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

/**
 * 鼠标移动处理拖动/缩放
 */
function onMouseMove(e: MouseEvent) {
  if (!dragState.value) return;
  const dx = e.clientX - dragState.value.startX;
  let newLeft = dragState.value.startLeft;
  let newWidth = dragState.value.startWidth;
  const minWidth = 80; // 最小选区宽度
  const maxLeft = props.minimapWidth - minWidth;

  if (dragState.value.type === 'move') {
    newLeft = Math.min(Math.max(0, dragState.value.startLeft + dx), props.minimapWidth - newWidth);
  } else if (dragState.value.type === 'resize-left') {
    newLeft = Math.min(
      Math.max(0, dragState.value.startLeft + dx),
      dragState.value.startLeft + dragState.value.startWidth - minWidth,
    );
    newWidth = dragState.value.startWidth + (dragState.value.startLeft - newLeft);
  } else if (dragState.value.type === 'resize-right') {
    newWidth = Math.max(minWidth, dragState.value.startWidth + dx);
    if (newLeft + newWidth > props.minimapWidth) {
      newWidth = props.minimapWidth - newLeft;
    }
  }
  // 实时更新本地状态并emit，保证选区和鼠标同步
  localViewLeft.value = newLeft;
  localViewWidth.value = newWidth;
  emit('updateView', newLeft, newWidth);
}

/**
 * 鼠标松开，结束拖动/缩放
 */
function onMouseUp() {
  dragState.value = null;
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
  margin-top: 4px;
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
