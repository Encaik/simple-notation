<template>
  <div ref="scrollContainer" @scroll="onScroll" class="piano-grid-scrollbar-thick">
    <div ref="gridContainer" class="relative" :style="gridStyle" @click="onGridClick">
      <!-- 播放头 -->
      <div
        ref="playhead"
        class="absolute top-0 bottom-0 w-0.5 bg-violet-500 z-10"
        style="display: none"
      ></div>

      <!-- 未来每个音符都是绝对定位小div -->
      <div
        v-for="note in notes"
        :key="note.index"
        class="absolute bg-blue-400 rounded-sm opacity-80 cursor-grab note-block"
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
          class="absolute top-0 left-0 h-full w-2 cursor-ew-resize resize-handle"
          @mousedown.stop="onResizeStart(note, 'left', $event)"
        ></div>
        <div
          class="absolute top-0 right-0 h-full w-2 cursor-ew-resize resize-handle"
          @mousedown.stop="onResizeStart(note, 'right', $event)"
        ></div>
      </div>
      <!-- 拖拽绘制预览 -->
      <div
        v-if="drawingNote"
        class="absolute bg-green-500 opacity-50 rounded-sm pointer-events-none"
        :style="getNoteStyle(drawingNote)"
      >
        <div class="px-1 text-xs text-white" style="line-height: 24px; user-select: none">
          {{ drawingNote.pitchName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePianoRoll, useTone } from '@/use';
import { computed, ref, onMounted, onBeforeUnmount, defineExpose } from 'vue';

const { playNote, midiToNoteName: _midiToNoteName, setInstrument, transport } = useTone();

const props = defineProps({
  beatsPerBar: { type: Number, default: 4 },
  quantization: { type: Number, default: 1 }, // 每格代表的拍数
  bars: { type: Number, default: 20 },
  barWidth: { type: Number, default: 160 },
  rows: { type: Number, default: 88 },
  rowHeight: { type: Number, default: 24 },
  tempo: { type: Number, default: 120 },
});

const scrollContainer = ref<HTMLDivElement | null>(null);
const playhead = ref<HTMLDivElement | null>(null);

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

const gridStyle = computed(() => {
  const { beatsPerBar, barWidth, rowHeight, quantization, rows } = props;
  const beatWidth = (barWidth / props.beatsPerBar) * quantization;

  const bgImages = [];
  const bgSizes = [];
  const bgPositions = [];
  const bgRepeats = [];

  // 1. 添加灰色的网格线 (置于顶层)
  // 横线
  bgImages.push(
    `repeating-linear-gradient(to bottom, #6b7280 0, #6b7280 1px, transparent 1px, transparent ${rowHeight}px)`,
  );
  // 竖线（细线）
  bgImages.push(
    `repeating-linear-gradient(to right, #6b7280 0, #6b7280 1px, transparent 1px, transparent ${beatWidth}px)`,
  );
  // 竖线（粗线）
  bgImages.push(
    `repeating-linear-gradient(to right, #9ca3af 0, #9ca3af 2px, transparent 2px, transparent ${barWidth}px)`,
  );
  // 网格线都是重复的
  bgSizes.push('100% 100%', '100% 100%', '100% 100%');
  bgPositions.push('0 0', '0 0', '0 0');
  bgRepeats.push('repeat', 'repeat', 'repeat');

  // 2. 为每个黑键行添加一个半透明的背景层 (置于底层)
  for (let i = 0; i < rows; i++) {
    if (isBlackKeyRow(i)) {
      bgImages.push('linear-gradient(to right, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15))');
      bgSizes.push(`100% ${rowHeight}px`);
      bgPositions.push(`0 ${i * rowHeight}px`);
      bgRepeats.push('no-repeat');
    }
  }

  return {
    width: `${props.barWidth * props.bars}px`,
    height: `${props.rows * props.rowHeight}px`,
    backgroundImage: bgImages.join(', '),
    backgroundSize: bgSizes.join(', '),
    backgroundPosition: bgPositions.join(', '),
    backgroundRepeat: bgRepeats.join(', '),
  };
});

/**
 * 音符结构体
 * @typedef {Object} Note
 * @property {number} index 音符序号
 * @property {number} pitch 音高（MIDI）
 * @property {number} duration 持续时长（拍）
 */
interface Note {
  index: number;
  pitch: number;
  pitchName: string;
  start: number;
  duration: number;
}

let notes = ref<Note[]>([]);

/**
 * 计算音符块的样式
 * @param {Note} note 音符对象
 * @returns {object} 样式对象
 */
function getNoteStyle(note: Note) {
  // 1拍（四分音符）的宽度
  const oneBeatWidth = props.barWidth / props.beatsPerBar;
  // 根据音符的节拍数计算 left 和 width
  const left = note.start * oneBeatWidth;
  const width = note.duration * oneBeatWidth - 1.5;
  const row = 108 - note.pitch;
  const top = row * props.rowHeight;
  const height = props.rowHeight - 1.5;
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    margin: '1px',
  };
}

// --- 标志位，防止调整/拖动后误触发点击事件 ---
let justManipulated = false;

// 1拍（四分音符）的宽度
const oneBeatWidth = computed(() => props.barWidth / props.beatsPerBar);

// --- 音符拖动调整大小 ---

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
  const deltaBeats = Math.round(dx / oneBeatWidth.value / props.quantization) * props.quantization;

  if (direction === 'left') {
    // 拖动左侧手柄
    const newStart = initialStart + deltaBeats;
    const newDuration = initialDuration - deltaBeats;
    if (newStart >= 0 && newDuration >= 1) {
      note.start = newStart;
      note.duration = newDuration;
    }
  } else {
    // 拖动右侧手柄
    const newDuration = initialDuration + deltaBeats;
    if (newDuration >= 1) {
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

// --- 音符拖动逻辑 ---

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
  const deltaBeats = Math.round(dx / oneBeatWidth.value / props.quantization) * props.quantization;
  const deltaPitchSteps = Math.round(dy / props.rowHeight);

  // 计算新位置
  let newStart = initialStart + deltaBeats;
  let newPitch = initialPitch - deltaPitchSteps; // Y轴反向

  // 限制在网格边界内
  const maxBeats = props.bars * props.beatsPerBar;
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

// --- 网格点击添加音符 ---
const gridContainer = ref<HTMLElement | null>(null);

/**
 * 点击网格空白处，添加一个新音符
 * @param event
 */
function onGridClick(event: MouseEvent) {
  if (justManipulated || !gridContainer.value) {
    return;
  }

  const rect = gridContainer.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 计算吸附到网格的节拍和音高
  const start = Math.floor(x / oneBeatWidth.value / props.quantization) * props.quantization;
  const row = Math.floor(y / props.rowHeight);
  const pitch = 108 - row;

  // 边界检查
  if (pitch < 21 || pitch > 108 || start >= props.bars * props.beatsPerBar) {
    return;
  }

  // 检查是否已有音符占据该位置
  const noteExists = notes.value.some(
    (n) => n.pitch === pitch && start >= n.start && start < n.start + n.duration,
  );
  if (noteExists) {
    return;
  }

  const pitchName = midiToPitchName(pitch);
  playNote(pitchName);

  // 添加新音符
  const newNote: Note = {
    index: notes.value.length ? Math.max(...notes.value.map((n) => n.index)) + 1 : 0,
    pitch: pitch,
    pitchName: pitchName,
    start: start,
    duration: 1, // 默认1拍
  };
  notes.value.push(newNote);
}

// --- 拖拽绘制音符 ---
const drawingNote = ref<Note | null>(null);
const isDrawing = ref(false);

function onGridDrawStart(event: MouseEvent) {
  // 只响应左键，且不能在音符上开始
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

  const start = Math.floor(x / oneBeatWidth.value / props.quantization) * props.quantization;
  const row = Math.floor(y / props.rowHeight);
  const pitch = 108 - row;

  drawingNote.value = {
    index: -1, // 临时id
    pitch,
    pitchName: midiToPitchName(pitch),
    start,
    duration: 1,
  };

  window.addEventListener('mousemove', onGridDrawMove);
  window.addEventListener('mouseup', onGridDrawEnd);
}

function onGridDrawMove(event: MouseEvent) {
  if (!drawingNote.value || !gridContainer.value) return;

  const rect = gridContainer.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const endBeat = Math.ceil(x / oneBeatWidth.value / props.quantization) * props.quantization;
  const newDuration = endBeat - drawingNote.value.start;

  if (newDuration > 0) {
    drawingNote.value.duration = newDuration;
  }
}

function onGridDrawEnd() {
  if (drawingNote.value && drawingNote.value.duration > 0) {
    // 检查位置是否被占用
    const newNote = drawingNote.value;
    const noteExists = notes.value.some(
      (n) =>
        n.pitch === newNote.pitch &&
        Math.max(n.start, newNote.start) <
          Math.min(n.start + n.duration, newNote.start + newNote.duration),
    );

    if (!noteExists) {
      playNote(newNote.pitchName);
      notes.value.push({
        ...newNote,
        index: notes.value.length ? Math.max(...notes.value.map((n) => n.index)) + 1 : 0,
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

// --- 右键删除音符 ---

const isRightMouseDown = ref(false);

/**
 * 删除指定的音符
 * @param noteToDelete
 */
function deleteNote(noteToDelete: Note) {
  const index = notes.value.findIndex((n) => n.index === noteToDelete.index);
  if (index > -1) {
    notes.value.splice(index, 1);
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

/**
 * 生成排序后的音符列表
 */
function generateNotesList() {
  // 按开始时间排序
  const sortedNotes = [...notes.value].sort((a, b) => a.start - b.start);
  return sortedNotes;
}

/**
 * 从外部设置音符列表
 * @param newNotes
 */
function setNotes(newNotes: Note[]) {
  notes.value = newNotes;
}

// 暴露方法给父组件
defineExpose({
  generateNotesList,
  setNotes,
});

let animationFrameId: number;

function animatePlayhead() {
  if (transport.state === 'started' && playhead.value) {
    const oneBeatWidth = props.barWidth / props.beatsPerBar;
    const currentBeats = transport.seconds * (props.tempo / 60);
    const leftPx = currentBeats * oneBeatWidth;
    playhead.value.style.transform = `translateX(${leftPx}px)`;
    playhead.value.style.display = 'block';
  } else if (playhead.value) {
    playhead.value.style.display = 'none';
  }
  animationFrameId = requestAnimationFrame(animatePlayhead);
}

onMounted(() => {
  setInstrument('piano');
  if (scrollContainer.value) {
    // 默认滚动到 C4 位置
    const C4_MIDI = 60;
    const C4_ROW_FROM_TOP = 108 - C4_MIDI;
    const c4YPosition = C4_ROW_FROM_TOP * props.rowHeight;

    // 使 C4 在视图中大致居中
    const containerHeight = scrollContainer.value.clientHeight;
    const initialScrollTop = c4YPosition - containerHeight / 2 + props.rowHeight / 2;
    scrollContainer.value.scrollTop = initialScrollTop;
  }

  gridContainer.value?.addEventListener('mousedown', onGridMouseDown);
  window.addEventListener('mouseup', onGridMouseUp);
  gridContainer.value?.addEventListener('contextmenu', onGridContextMenu);
  animatePlayhead();
});
onBeforeUnmount(() => {
  gridContainer.value?.removeEventListener('mousedown', onGridMouseDown);
  window.removeEventListener('mouseup', onGridMouseUp);
  gridContainer.value?.removeEventListener('contextmenu', onGridContextMenu);
  cancelAnimationFrame(animationFrameId);
});

const { setScrollTop, setScrollLeft } = usePianoRoll();

function onScroll(e: Event) {
  if (!e.target) return;
  const target = e.target as HTMLDivElement;
  setScrollTop(target.scrollTop);
  setScrollLeft(target.scrollLeft);
}
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
