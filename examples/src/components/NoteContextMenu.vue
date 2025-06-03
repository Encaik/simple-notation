<template>
  <div
    v-if="isVisible"
    ref="menuRef"
    :style="{ top: `${realY}px`, left: `${realX}px` }"
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
        ref="accidentalMenuRef"
        :style="{ left: accidentalMenuX + 'px', top: accidentalMenuY + 'px' }"
        class="absolute bg-white border border-gray-300 rounded shadow-md py-1 min-w-[80px] z-50"
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
        ref="chordMenuRef"
        :style="{ left: chordMenuX + 'px', top: chordMenuY + 'px' }"
        class="absolute bg-white border border-gray-300 rounded shadow-md py-2 min-w-[220px] z-50"
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
        ref="durationMenuRef"
        :style="{ left: durationMenuX + 'px', top: durationMenuY + 'px' }"
        class="absolute bg-white border border-gray-300 rounded shadow-md py-1 min-w-[120px] z-50"
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
import { defineProps, defineEmits, ref, watch, nextTick } from 'vue';
import { usePlayer } from '../use/usePlayer';
import { useEditorStore } from '../stores';
import { SNNote } from '@components';

const props = defineProps({
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
    type: [SNNote, Array<SNNote>, null],
    default: () => null,
  },
});

const onNoteCopy = () => {
  console.log(props.noteData);
  if (props.noteData) {
    if (Array.isArray(props.noteData)) {
      navigator.clipboard.writeText(
        props.noteData.map((n) => n.noteData).join(','),
      );
    } else {
      navigator.clipboard.writeText(props.noteData.noteData);
    }
  }
};

const { player, play, setCurrentIndex } = usePlayer();

const onNotePlay = async () => {
  if (props.noteData) {
    if (Array.isArray(props.noteData)) {
      setCurrentIndex(props.noteData[0].index - 2);
    } else {
      setCurrentIndex(props.noteData.index - 2);
    }
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
 * 结构化插入/替换音符文本的指定部分（和弦、升降号、时值等）
 * @param {string} noteText - 原始音符文本
 * @param {Object} options - 插入/替换选项
 * @param {string} [options.chord] - 新和弦内容（如 Cmaj7），不传则不处理
 * @param {string} [options.accidental] - 新升降号内容（如 #、b、bb），不传则不处理
 * @param {string} [options.duration] - 新时值内容（如 /8、/16.），不传则不处理
 * @returns {string} 处理后的音符文本
 */
function updateNoteText(
  noteText: string,
  options: { chord?: string; accidental?: string; duration?: string },
) {
  // 先处理和弦（和弦在最前面，可能有多个）
  let text = noteText;
  if (options.chord !== undefined) {
    // 移除所有和弦
    text = text.replace(/(\{[^}]+\})/g, '');
    // 插入新和弦
    text = `{${options.chord}}` + text;
  }
  // 处理升降号/音符/时值/附点/八度
  // 结构: 升降号([#b]{0,}) 音符(\d|-) 时值(\/(2|4|8|16|32))? 附点(\.)? 八度([\^_]*)
  text = text.replace(
    /([#b]{0,})(\d|-)(\/(2|4|8|16|32))?(\.)?([\^_]*)/,
    (_match, accidental, note, duration, _d, dot, octave) => {
      let result = '';
      // 升降号
      if (options.accidental !== undefined) {
        result += options.accidental;
      } else {
        result += accidental || '';
      }
      // 音符
      result += note;
      // 时值
      if (options.duration !== undefined) {
        result += options.duration;
      } else if (duration) {
        result += duration;
      }
      // 附点
      result += dot || '';
      // 八度
      result += octave || '';
      return result;
    },
  );
  return text;
}

/**
 * 插入或替换升降符号
 * @param {string} symbol - 要插入的升降符号
 */
const onInsertAccidental = (symbol: string) => {
  if (props.noteData) {
    const view = editorStore.scoreEditorView;
    if (!view) return;
    if (Array.isArray(props.noteData)) {
      // 批量操作，收集所有 changes，最后一次性 dispatch
      const changes = props.noteData.map((n) => {
        const [start, end] = n.getTextRange();
        const oldText = view.state.sliceDoc(start, end);
        const newText = updateNoteText(oldText, { accidental: symbol });
        return { from: start, to: end, insert: newText };
      });
      if (changes.length > 0) {
        view.dispatch({
          changes: changes as any,
          selection: {
            anchor: (changes[0]?.from ?? 0) + (changes[0]?.insert?.length ?? 0),
          },
          scrollIntoView: true,
        });
        view.focus();
      }
    } else {
      const [start, end] = props.noteData.getTextRange();
      if (typeof start === 'number' && typeof end === 'number') {
        const oldText = view.state.sliceDoc(start, end);
        const newText = updateNoteText(oldText, { accidental: symbol });
        view.dispatch({
          changes: { from: start, to: end, insert: newText },
          selection: { anchor: start + newText.length },
          scrollIntoView: true,
        });
        view.focus();
      }
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
 * 插入或替换和弦符号
 * @param {string} chord - 要插入的和弦内容
 */
const onInsertChord = (chord: string) => {
  if (props.noteData) {
    const view = editorStore.scoreEditorView;
    if (!view) return;
    if (Array.isArray(props.noteData)) {
      // 批量操作，收集所有 changes，最后一次性 dispatch
      const changes = props.noteData.map((n) => {
        const [start, end] = n.getTextRange();
        const oldText = view.state.sliceDoc(start, end);
        const newText = updateNoteText(oldText, { chord });
        return { from: start, to: end, insert: newText };
      });
      if (changes.length > 0) {
        view.dispatch({
          changes: changes as any,
          selection: {
            anchor: (changes[0]?.from ?? 0) + (changes[0]?.insert?.length ?? 0),
          },
          scrollIntoView: true,
        });
        view.focus();
      }
    } else {
      const [start, end] = props.noteData.getTextRange();
      if (typeof start === 'number' && typeof end === 'number') {
        const oldText = view.state.sliceDoc(start, end);
        const newText = updateNoteText(oldText, { chord });
        view.dispatch({
          changes: { from: start, to: end, insert: newText },
          selection: { anchor: start + newText.length },
          scrollIntoView: true,
        });
        view.focus();
      }
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
 * 插入或替换时值内容
 * @param {string} value - 要插入的时值内容（如 /8、/16.）
 */
const onInsertDuration = (value: string) => {
  if (props.noteData) {
    const view = editorStore.scoreEditorView;
    if (!view) return;
    if (Array.isArray(props.noteData)) {
      // 批量操作，收集所有 changes，最后一次性 dispatch
      const changes = props.noteData.map((n) => {
        const [start, end] = n.getTextRange();
        const oldText = view.state.sliceDoc(start, end);
        const newText = updateNoteText(oldText, { duration: value });
        return { from: start, to: end, insert: newText };
      });
      if (changes.length > 0) {
        view.dispatch({
          changes: changes as any,
          selection: {
            anchor: (changes[0]?.from ?? 0) + (changes[0]?.insert?.length ?? 0),
          },
          scrollIntoView: true,
        });
        view.focus();
      }
    } else {
      const [start, end] = props.noteData.getTextRange();
      if (typeof start === 'number' && typeof end === 'number') {
        const oldText = view.state.sliceDoc(start, end);
        const newText = updateNoteText(oldText, { duration: value });
        view.dispatch({
          changes: { from: start, to: end, insert: newText },
          selection: { anchor: start + newText.length },
          scrollIntoView: true,
        });
        view.focus();
      }
    }
  }
};

// 主菜单实际显示位置
const realX = ref(props.x);
const realY = ref(props.y);
const menuRef = ref<HTMLElement | null>(null);

// 升降符号子菜单实际显示位置
const accidentalMenuRef = ref<HTMLElement | null>(null);
const accidentalMenuX = ref(0);
const accidentalMenuY = ref(0);
// 和弦子菜单实际显示位置
const chordMenuRef = ref<HTMLElement | null>(null);
const chordMenuX = ref(0);
const chordMenuY = ref(0);
// 时值子菜单实际显示位置
const durationMenuRef = ref<HTMLElement | null>(null);
const durationMenuX = ref(0);
const durationMenuY = ref(0);

/**
 * 计算主菜单实际显示位置，防止溢出窗口
 * @param {number} x - 期望的x坐标
 * @param {number} y - 期望的y坐标
 * @param {HTMLElement} menuEl - 菜单DOM节点
 * @returns {{x: number, y: number}} 实际显示坐标
 */
function calcMainMenuPosition(x: number, y: number, menuEl: HTMLElement) {
  const rect = menuEl.getBoundingClientRect();
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;
  let newX = x;
  let newY = y;
  if (x + rect.width > winWidth) {
    newX = Math.max(0, winWidth - rect.width - 10);
  }
  if (y + rect.height > winHeight) {
    newY = Math.max(0, winHeight - rect.height - 10);
  }
  return { x: newX, y: newY };
}

/**
 * 计算子菜单实际显示位置，防止溢出窗口
 * @param {HTMLElement} parentEl - 父菜单元素
 * @param {HTMLElement} subMenuEl - 子菜单元素
 * @returns {{x: number, y: number}} 实际显示坐标
 */
function calcSubMenuPosition(parentEl: HTMLElement, subMenuEl: HTMLElement) {
  const parentRect = parentEl.getBoundingClientRect();
  const subRect = subMenuEl.getBoundingClientRect();
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;
  let x = parentRect.width; // 默认向右弹出
  let y = 0; // 默认顶部对齐
  // 右侧溢出则向左弹出
  if (parentRect.right + subRect.width > winWidth) {
    x = -subRect.width;
  }
  // 下方溢出则向上对齐
  if (parentRect.top + subRect.height > winHeight) {
    y = winHeight - parentRect.top - subRect.height;
    if (y < 0) y = 0;
  }
  return { x, y };
}

// 监听主菜单显示，自动调整所有子面板并修正主菜单位置
watch(
  () => props.isVisible,
  async (val) => {
    if (val) {
      showChordMenu.value = false;
      showAccidentalMenu.value = false;
      showDurationMenu.value = false;
      await nextTick();
      if (menuRef.value) {
        const { x: newX, y: newY } = calcMainMenuPosition(
          props.x,
          props.y,
          menuRef.value,
        );
        realX.value = newX;
        realY.value = newY;
      }
    }
  },
  { immediate: true },
);
// 监听x/y变化，菜单未显示时也要同步
watch([() => props.x, () => props.y], ([newX, newY]) => {
  realX.value = newX;
  realY.value = newY;
});

// 监听升降符号子菜单显示，动态调整位置
watch(showAccidentalMenu, async (val) => {
  if (val) {
    await nextTick();
    if (accidentalMenuRef.value && menuRef.value) {
      const { x, y } = calcSubMenuPosition(
        menuRef.value,
        accidentalMenuRef.value,
      );
      accidentalMenuX.value = x;
      accidentalMenuY.value = y;
    }
  }
});
// 监听和弦子菜单显示，动态调整位置
watch(showChordMenu, async (val) => {
  if (val) {
    await nextTick();
    if (chordMenuRef.value && menuRef.value) {
      const { x, y } = calcSubMenuPosition(menuRef.value, chordMenuRef.value);
      chordMenuX.value = x;
      chordMenuY.value = y;
    }
  }
});
// 监听时值子菜单显示，动态调整位置
watch(showDurationMenu, async (val) => {
  if (val) {
    await nextTick();
    if (durationMenuRef.value && menuRef.value) {
      const { x, y } = calcSubMenuPosition(
        menuRef.value,
        durationMenuRef.value,
      );
      durationMenuX.value = x;
      durationMenuY.value = y;
    }
  }
});
</script>
