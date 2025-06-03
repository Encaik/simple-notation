<template>
  <div
    v-if="isVisible"
    :style="{ top: `${y}px`, left: `${x}px` }"
    class="note-context-menu absolute z-50 bg-white border border-gray-300 rounded shadow-md py-1 min-w-[100px] text-sm"
  >
    <div
      @click="onNoteCopy"
      class="menu-item px-4 py-2 cursor-pointer hover:bg-gray-200"
    >
      复制音符
    </div>
    <div
      v-if="player"
      @click="onNotePlay"
      class="menu-item px-4 py-2 cursor-pointer hover:bg-gray-200"
    >
      从此播放
    </div>
    <div
      class="menu-item px-4 py-2 cursor-pointer hover:bg-gray-200 relative"
      @mouseenter="showAccidentalMenu = true"
      @mouseleave="showAccidentalMenu = false"
    >
      添加升降符号
      <div
        v-if="showAccidentalMenu"
        class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-md py-1 min-w-[80px] z-50"
        style="white-space: nowrap"
      >
        <div
          v-for="item in accidentalList"
          :key="item.label"
          class="px-4 py-2 cursor-pointer hover:bg-gray-200"
          @click="onInsertAccidental(item.symbol)"
        >
          {{ item.label }}
        </div>
      </div>
    </div>
    <div
      class="menu-item px-4 py-2 cursor-pointer hover:bg-gray-200 relative"
      @mouseenter="showChordMenu = true"
      @mouseleave="showChordMenu = false"
    >
      添加和弦符号
      <div
        v-if="showChordMenu"
        class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-md py-2 min-w-[220px] z-50"
        style="white-space: nowrap"
      >
        <!-- 字母和弦网格布局，每一行是一个根音，每一列是和弦类型 -->
        <div
          class="grid gap-x-2 gap-y-1 p-2"
          :style="`grid-template-columns: repeat(${chordTypes.length}, auto);`"
        >
          <template v-for="root in chordRoots" :key="root">
            <template v-for="type in chordTypes" :key="type">
              <div
                class="inline-flex px-2 py-1 cursor-pointer hover:bg-gray-200 rounded min-w-0 justify-center"
                @click="onInsertChord(root + type)"
              >
                {{ root + type }}
              </div>
            </template>
          </template>
        </div>
        <!-- 数字和弦网格布局，每一行是一个数字根音，每一列是和弦类型 -->
        <div
          class="grid gap-x-2 gap-y-1 p-2 border-t mt-1"
          :style="`grid-template-columns: repeat(${chordTypes.length}, auto);`"
        >
          <template v-for="root in chordRootsNum" :key="root">
            <template v-for="type in chordTypes" :key="type">
              <div
                class="inline-flex px-2 py-1 cursor-pointer hover:bg-gray-200 rounded min-w-0 justify-center"
                @click="onInsertChord(root + type)"
              >
                {{ root + type }}
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>
    <div
      class="menu-item px-4 py-2 cursor-pointer hover:bg-gray-200 relative"
      @mouseenter="showDurationMenu = true"
      @mouseleave="showDurationMenu = false"
    >
      修改时值
      <div
        v-if="showDurationMenu"
        class="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-md py-1 min-w-[120px] z-50"
        style="white-space: nowrap"
      >
        <div
          v-for="item in durationList"
          :key="item.label"
          class="px-4 py-2 cursor-pointer hover:bg-gray-200"
          @click="onInsertDuration(item.value)"
        >
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';
import { usePlayer } from '../use/usePlayer';
import { useEditorStore } from '../stores';

const { isVisible, x, y, noteData } = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  x: {
    type: Number,
    default: 0,
  },
  y: {
    type: Number,
    default: 0,
  },
  noteData: {
    type: [Object, null],
    default: () => ({}),
  },
});

const onNoteCopy = () => {
  if (noteData?.noteData) {
    navigator.clipboard.writeText(noteData.noteData);
  }
};

const { player, play, setCurrentIndex } = usePlayer();

const onNotePlay = async () => {
  if (noteData) {
    setCurrentIndex(noteData.index - 2);
    play();
  }
};

const emit = defineEmits(['close']);

const showAccidentalMenu = ref(false);
const accidentalList = [
  { label: '升号(♯)', symbol: '#' },
  { label: '降号(♭)', symbol: 'b' },
  { label: '重升号(𝄪)', symbol: '##' },
  { label: '重降号(𝄫)', symbol: 'bb' },
  { label: '还原号(♮)', symbol: '=' },
];

const editorStore = useEditorStore();

/**
 * 在当前音符文本前插入升降符号
 * @param {string} symbol - 要插入的符号
 */
const onInsertAccidental = (symbol: string) => {
  if (noteData && typeof noteData.getTextRange === 'function') {
    const [start] = noteData.getTextRange();
    const view = editorStore.scoreEditorView;
    if (view && typeof start === 'number') {
      view.dispatch({
        changes: { from: start, to: start, insert: symbol },
        selection: { anchor: start + symbol.length },
        scrollIntoView: true,
      });
      view.focus();
    }
  }
};

const showChordMenu = ref(false);

/**
 * 和弦根音（字母）
 */
const chordRoots = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
/**
 * 和弦根音（数字）
 */
const chordRootsNum = ['1', '2', '3', '4', '5', '6', '7'];
/**
 * 和弦类型
 */
const chordTypes = ['', 'm', 'maj7', 'm7'];

/**
 * 在当前音符文本前插入和弦符号
 * @param {string} chord - 要插入的和弦内容
 */
const onInsertChord = (chord: string) => {
  if (noteData && typeof noteData.getTextRange === 'function') {
    const [start] = noteData.getTextRange();
    const view = editorStore.scoreEditorView;
    if (view && typeof start === 'number') {
      const insertText = `{${chord}}`;
      view.dispatch({
        changes: { from: start, to: start, insert: insertText },
        selection: { anchor: start + insertText.length },
        scrollIntoView: true,
      });
      view.focus();
    }
  }
};

const showDurationMenu = ref(false);
/**
 * 时值选项列表
 */
const durationList = [
  { label: '全音符', value: ',-,-,-' },
  { label: '二分音符', value: ',-' },
  { label: '四分音符', value: ',' },
  { label: '附点四分音符', value: '.' },
  { label: '八分音符', value: '/8' },
  { label: '附点八分音符', value: '/8.' },
  { label: '十六分音符', value: '/16' },
  { label: '附点十六分音符', value: '/16.' },
  { label: '三十二分音符', value: '/32' },
  { label: '附点三十二分音符', value: '/32.' },
];

/**
 * 在当前音符文本后插入时值内容
 * @param {string} value - 要插入的时值内容
 */
const onInsertDuration = (value: string) => {
  if (noteData && typeof noteData.getTextRange === 'function') {
    const [, end] = noteData.getTextRange();
    const view = editorStore.scoreEditorView;
    if (view && typeof end === 'number') {
      view.dispatch({
        changes: { from: end, to: end, insert: value },
        selection: { anchor: end + value.length },
        scrollIntoView: true,
      });
      view.focus();
    }
  }
};

// 监听主菜单显示，自动关闭所有子面板
watch(
  () => isVisible,
  (val) => {
    if (val) {
      showChordMenu.value = false;
      showAccidentalMenu.value = false;
      showDurationMenu.value = false;
    }
  },
);
</script>
