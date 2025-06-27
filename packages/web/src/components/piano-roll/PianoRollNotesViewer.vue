<template>
  <!-- 可编辑音符 (z-20) -->
  <div
    v-for="note in pianoRollStore.pianoRollNotes"
    :key="note.index"
    class="absolute bg-blue-400 rounded-sm opacity-80 cursor-grab note-block z-20"
    :style="getNoteStyle(note)"
    @mousedown.stop="onNoteMouseDown(note, $event)"
    @contextmenu.prevent="onNoteContextMenu(note, $event)"
    @mouseenter="onNoteMouseEnter(note)"
  >
    <div class="px-1 text-xs text-white" style="line-height: 24px; user-select: none">
      {{ note.pitchName }}
    </div>
    <!-- 左右拖拽手柄 -->
    <div
      class="absolute top-0 left-0 h-full w-2 cursor-ew-resize resize-handle z-30"
      @mousedown.stop="onResizeStart(note, 'left', $event)"
    ></div>
    <div
      class="absolute top-0 right-0 h-full w-2 cursor-ew-resize resize-handle z-30"
      @mousedown.stop="onResizeStart(note, 'right', $event)"
    ></div>
  </div>
  <!-- 拖拽绘制预览 (z-20) -->
  <div
    v-if="drawingNote"
    class="absolute bg-green-500 opacity-50 rounded-sm pointer-events-none z-20"
    :style="getNoteStyle(drawingNote)"
  >
    <div class="px-1 text-xs text-white" style="line-height: 24px; user-select: none">
      {{ drawingNote.pitchName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Note } from '@/model';
import { usePianoRollStore } from '@/stores';
import { useTone } from '@/use';
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const { playNote } = useTone();
const pianoRollStore = usePianoRollStore();
const { barWidth, gridContainer, bars, beatsPerBar, rowHeight, quantization, mp3Offset } =
  storeToRefs(pianoRollStore);
const oneBeatWidth = computed(() => barWidth.value / beatsPerBar.value);

// #region 音符块

/**
 * 计算音符块的样式
 * @param {Note} note 音符对象
 * @returns {object} 样式对象
 */
function getNoteStyle(note: Note) {
  const start = note.start;
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

// #endregion

// --- 标志位，防止调整/拖动后误触发点击事件 ---
let justManipulated = false;

// #region 音符拖动调整大小
const resizingNote = ref<{
  note: Note;
  direction: 'left' | 'right';
  initialMouseX: number;
  initialStart: number;
  initialDuration: number;
} | null>(null);

/**
 * 开始调整音符大小
 * @param note
 * @param direction
 * @param event
 */
function onResizeStart(note: Note, direction: 'left' | 'right', event: MouseEvent) {
  event.preventDefault();

  gridContainer.value?.classList.add('is-resizing');

  resizingNote.value = {
    note,
    direction,
    initialMouseX: event.clientX,
    initialStart: note.start,
    initialDuration: note.duration,
  };
  // 在 body 上添加样式，保证在拖拽出元素范围时指针样式不变
  document.body.style.cursor = 'ew-resize';
  document.body.style.userSelect = 'none';

  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('mouseup', onResizeEnd);
}

/**
 * 调整音符大小中
 * @param event
 */
function onResizeMove(event: MouseEvent) {
  if (!resizingNote.value) return;

  const { note, direction, initialMouseX, initialStart, initialDuration } = resizingNote.value;
  const dx = event.clientX - initialMouseX;
  // 将像素偏移转换为节拍数偏移
  const deltaBeats = Math.round(dx / oneBeatWidth.value / quantization.value) * quantization.value;

  if (direction === 'left') {
    // 拖动左侧手柄
    const newStart = initialStart + deltaBeats;
    const newDuration = initialDuration - deltaBeats;
    // 最小duration为当前量化单位
    if (newStart >= 0 && newDuration >= quantization.value) {
      note.start = newStart;
      note.duration = newDuration;
    }
  } else {
    // 拖动右侧手柄
    const newDuration = initialDuration + deltaBeats;
    // 最小duration为当前量化单位
    if (newDuration >= quantization.value) {
      note.duration = newDuration;
    }
  }
}

/**
 * 结束调整音符大小
 */
function onResizeEnd() {
  gridContainer.value?.classList.remove('is-resizing');

  if (resizingNote.value) {
    justManipulated = true;
    setTimeout(() => {
      justManipulated = false;
    }, 10);
  }
  resizingNote.value = null;

  // 恢复 body 样式
  document.body.style.cursor = '';
  document.body.style.userSelect = '';

  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', onResizeEnd);
}

// #endregion

/**
 * 将MIDI号转换为音名
 * @param {number} midi MIDI音高
 * @returns {string} 音名 (e.g., C4)
 */
const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiToPitchName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteName = PITCH_NAMES[midi % 12];
  return `${noteName}${octave}`;
}

// #region 音符拖动逻辑

let playPitchDebounceTimer: number | undefined;

const draggedNote = ref<{
  note: Note;
  initialMouseX: number;
  initialMouseY: number;
  initialStart: number;
  initialPitch: number;
} | null>(null);

/**
 * 鼠标按下音符，开始拖动
 * @param note
 * @param event
 */
function onNoteMouseDown(note: Note, event: MouseEvent) {
  // 如果正在调整大小，则不触发拖动
  if (resizingNote.value) {
    return;
  }

  event.preventDefault(); // 防止浏览器默认的拖拽行为
  event.stopPropagation(); // 防止触发 grid 的 click 事件

  gridContainer.value?.classList.add('is-dragging');

  // 如果点击的是手柄，则不触发拖动
  if ((event.target as HTMLElement).classList.contains('resize-handle')) {
    return;
  }

  draggedNote.value = {
    note,
    initialMouseX: event.clientX,
    initialMouseY: event.clientY,
    initialStart: note.start,
    initialPitch: note.pitch,
  };

  // 在 body 上添加样式，保证在拖拽出元素范围时指针样式不变
  document.body.style.cursor = 'grabbing';
  document.body.style.userSelect = 'none';

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

/**
 * 鼠标移动，更新音符位置
 * @param event
 */
function onMouseMove(event: MouseEvent) {
  if (!draggedNote.value) return;

  const { note, initialMouseX, initialMouseY, initialStart, initialPitch } = draggedNote.value;

  const dx = event.clientX - initialMouseX;
  const dy = event.clientY - initialMouseY;

  // 计算吸附到网格的节拍偏移
  const deltaBeats = Math.round(dx / oneBeatWidth.value / quantization.value) * quantization.value;
  const deltaPitchSteps = Math.round(dy / rowHeight.value);

  // 计算新位置
  let newStart = initialStart + deltaBeats;
  let newPitch = initialPitch - deltaPitchSteps; // Y轴反向

  // 限制在网格边界内
  const maxBeats = bars.value * beatsPerBar.value;
  newStart = Math.max(0, Math.min(newStart, maxBeats - note.duration));
  newPitch = Math.max(21, Math.min(newPitch, 108)); // MIDI 21~108

  // 如果音高发生变化，则播放声音（带节流）
  if (note.pitch !== newPitch) {
    clearTimeout(playPitchDebounceTimer);
    playPitchDebounceTimer = window.setTimeout(() => {
      playNote(midiToPitchName(newPitch));
    }, 50); // 50ms 延迟
  }

  // 更新音符数据
  if (note.start !== newStart || note.pitch !== newPitch) {
    note.start = newStart;
    note.pitch = newPitch;
    note.pitchName = midiToPitchName(newPitch);
  }
}

/**
 * 鼠标松开，结束拖动
 */
function onMouseUp() {
  gridContainer.value?.classList.remove('is-dragging');
  clearTimeout(playPitchDebounceTimer); // 拖动结束时清除定时器

  if (draggedNote.value) {
    // 可以在这里处理拖动结束后的回调，例如保存数据
    justManipulated = true;
    setTimeout(() => {
      justManipulated = false;
    }, 10);
  }
  draggedNote.value = null;

  // 恢复 body 样式
  document.body.style.cursor = '';
  document.body.style.userSelect = '';

  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}

// #endregion

// #region 拖拽绘制音符
const drawingNote = ref<Note | null>(null);
const isDrawing = ref(false);

function onGridDrawStart(event: MouseEvent) {
  if (
    event.button !== 0 ||
    (event.target as HTMLElement).closest('.note-block') ||
    !gridContainer.value
  ) {
    return;
  }
  isDrawing.value = true;
  justManipulated = false; // 重置标志位
  const rect = gridContainer.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  // 计算吸附到网格的节拍和音高，start严格用Math.floor吸附
  const quant = quantization.value;
  const start = Number((Math.floor(x / oneBeatWidth.value / quant) * quant).toFixed(6));
  const row = Math.floor(y / rowHeight.value);
  const pitch = 108 - row;
  drawingNote.value = {
    index: -1, // 临时id
    pitch,
    pitchName: midiToPitchName(pitch),
    start: start, // 只用网格基准
    duration: quantization.value,
  };
  window.addEventListener('mousemove', onGridDrawMove);
  window.addEventListener('mouseup', onGridDrawEnd);
}

function onGridDrawMove(event: MouseEvent) {
  if (!drawingNote.value || !gridContainer.value) return;
  const rect = gridContainer.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  // 计算当前吸附到网格的拍数
  const quant = quantization.value;
  const end = Number((Math.floor(x / oneBeatWidth.value / quant) * quant).toFixed(6));
  // duration只计算end和start的差值
  const newDuration = end - drawingNote.value.start;
  if (newDuration > 0) {
    drawingNote.value.duration = newDuration;
  }
}

function onGridDrawEnd() {
  if (drawingNote.value && drawingNote.value.duration > 0) {
    // 检查位置是否被占用
    const newNote = drawingNote.value;
    const noteExists = pianoRollStore.pianoRollNotes.some(
      (n) =>
        n.pitch === newNote.pitch &&
        Math.max(n.start, newNote.start) <
          Math.min(n.start + n.duration, newNote.start + newNote.duration),
    );

    if (!noteExists) {
      playNote(newNote.pitchName);
      pianoRollStore.pianoRollNotes.push({
        ...newNote,
        index: pianoRollStore.pianoRollNotes.length
          ? Math.max(...pianoRollStore.pianoRollNotes.map((n) => n.index)) + 1
          : 0,
      });
    }
  }

  isDrawing.value = false;
  drawingNote.value = null;
  window.removeEventListener('mousemove', onGridDrawMove);
  window.removeEventListener('mouseup', onGridDrawEnd);
  // 设置标志位，防止触发 click
  justManipulated = true;
  setTimeout(() => (justManipulated = false), 10);
}

// #endregion

// #region 右键删除音符

const isRightMouseDown = ref(false);

/**
 * 删除指定的音符
 * @param noteToDelete
 */
function deleteNote(noteToDelete: Note) {
  const index = pianoRollStore.pianoRollNotes.findIndex((n) => n.index === noteToDelete.index);
  if (index > -1) {
    pianoRollStore.pianoRollNotes.splice(index, 1);
  }
}

/**
 * 右键单击音符，删除
 * @param note
 * @param event
 */
function onNoteContextMenu(note: Note, event: MouseEvent) {
  event.preventDefault();
  deleteNote(note);
}

/**
 * 鼠标进入音符，如果右键按下，则删除
 * @param note
 */
function onNoteMouseEnter(note: Note) {
  if (isRightMouseDown.value) {
    deleteNote(note);
  }
}

/**
 * 在整个网格上监听鼠标右键按下和松开
 */
function onGridMouseDown(event: MouseEvent) {
  if (event.button === 2) {
    isRightMouseDown.value = true;
  } else if (event.button === 0) {
    onGridDrawStart(event);
  }
}
function onGridMouseUp(event: MouseEvent) {
  if (event.button === 2) {
    isRightMouseDown.value = false;
  }
}
function onGridContextMenu(event: MouseEvent) {
  // 阻止在网格空白处弹出菜单和浏览器默认手势
  event.preventDefault();
}

// #endregion

// #region 初始化
onMounted(() => {
  window.addEventListener('mouseup', onGridMouseUp);
});

watch(gridContainer, (container) => {
  container?.removeEventListener('mousedown', onGridMouseDown);
  container?.removeEventListener('contextmenu', onGridContextMenu);
  container?.addEventListener('mousedown', onGridMouseDown);
  container?.addEventListener('contextmenu', onGridContextMenu);
});

onBeforeUnmount(() => {
  gridContainer.value?.removeEventListener('mousedown', onGridMouseDown);
  window.removeEventListener('mouseup', onGridMouseUp);
  gridContainer.value?.removeEventListener('contextmenu', onGridContextMenu);
});
// #endregion
</script>
