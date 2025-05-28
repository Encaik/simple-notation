<template>
  <div
    class="max-w-[1200px] w-full mt-5 mx-auto bg-white bg-opacity-95 p-5 rounded-lg shadow-md flex flex-col gap-4 overflow-hidden box-border hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
  >
    <div class="flex flex-row flex-wrap items-center gap-[10px]">
      <button
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90"
        @click="print"
      >
        🖨️打印
      </button>
      <button
        v-if="playState === 'idle'"
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90"
        @click="playHandle"
      >
        ▶️播放
      </button>
      <button
        v-if="playState === 'playing'"
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90"
        @click="pauseHandle"
      >
        ⏸️暂停
      </button>
      <button
        v-if="playState === 'paused'"
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90"
        @click="resumeHandle"
      >
        ▶️继续
      </button>
      <button
        v-if="playState === 'playing' || playState === 'paused'"
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90"
        @click="stopHandle"
      >
        ⏹️停止
      </button>
      <button
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90"
        @click="emitExport"
      >
        📤导出
      </button>
      <div class="flex items-center gap-1 text-sm relative">
        <button
          class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90"
          @click="triggerImport"
        >
          📥导入
        </button>
        <div
          class="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold cursor-pointer relative"
          @mouseover="showTooltip = true"
          @mouseleave="showTooltip = false"
          @click.stop="toggleTooltip"
        >
          ?
          <div
            v-if="showTooltip"
            class="absolute z-10 text-left top-1/2 left-full ml-2 w-40 p-2 bg-black text-white text-xs rounded shadow-lg transform -translate-y-1/2"
          >
            支持导入：
            <div>.json(模板语法导出文件)</div>
            <div>.txt (ABC谱文本文件)</div>
            <!-- <div>.mid, .midi (MIDI文件)</div> -->
          </div>
        </div>
      </div>
      <button
        class="py-2 px-3 border rounded text-sm cursor-pointer min-h-auto box-border w-24 focus:outline-none focus:ring-2 focus:ring-opacity-10 transition-colors duration-200"
        :class="
          isAccompanimentActive
            ? 'bg-[#7b5aff] text-white border-[#7b5aff] focus:border-[#7b5aff] focus:ring-[#7b5aff] hover:bg-[#6a4ac9]'
            : 'bg-white bg-opacity-80 border-[#ddd] focus:border-[#ff6b3d] focus:ring-[#ff6b3d] hover:bg-opacity-90'
        "
        @click="toggleAccompaniment"
      >
        {{ isAccompanimentActive ? '✅' : '❌' }}伴奏
      </button>
      <button
        class="py-2 px-3 border rounded text-sm cursor-pointer min-h-auto box-border w-24 focus:outline-none focus:ring-2 focus:ring-opacity-10 transition-colors duration-200"
        :class="
          isMelodyActive
            ? 'bg-[#7b5aff] text-white border-[#7b5aff] focus:border-[#7b5aff] focus:ring-[#7b5aff] hover:bg-[#6a4ac9]'
            : 'bg-white bg-opacity-80 border-[#ddd] focus:border-[#ff6b3d] focus:ring-[#ff6b3d] hover:bg-opacity-90'
        "
        @click="toggleMelody"
      >
        {{ isMelodyActive ? '✅' : '❌' }}旋律
      </button>
      <button
        class="py-2 px-3 border rounded text-sm cursor-pointer min-h-auto box-border w-24 focus:outline-none focus:ring-2 focus:ring-opacity-10 transition-colors duration-200"
        :class="
          isFixedPitchActive
            ? 'bg-[#7b5aff] text-white border-[#7b5aff] focus:border-[#7b5aff] focus:ring-[#7b5aff] hover:bg-[#6a4ac9]'
            : 'bg-[#ff6b3d] text-white border-[#ff6b3d] focus:border-[#ff6b3d] focus:ring-[#ff6b3d] hover:bg-[#ff6b3d]'
        "
        @click="togglePitchType"
      >
        {{ isFixedPitchActive ? '固定调' : '首调' }}
      </button>

      <!-- 手动移调下拉框 -->
      <div class="flex items-center gap-1 text-sm">
        <label for="transpose-key">移调到:</label>
        <select
          id="transpose-key"
          v-model="selectedTransposeKey"
          :disabled="isFixedPitchActive"
          class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option v-for="key in transposeKeys" :key="key" :value="key">
            {{ key }}
          </option>
        </select>
      </div>

      <!-- 乐器选择下拉框 -->
      <div class="flex items-center gap-1 text-sm">
        <label for="instrument-select">音色:</label>
        <select
          id="instrument-select"
          v-model="selectedInstrument"
          class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90"
        >
          <option
            v-for="instrument in instruments"
            :key="instrument.value"
            :value="instrument.value"
          >
            {{ instrument.name }}
            <!-- 格式化显示名称 -->
          </option>
        </select>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept=".json,.txt,.mid,.midi"
        style="display: none"
        @change="onFileChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SNPointerLayer } from '@layers';
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useTone } from '../use/useTone';
import { defineEmits, defineProps } from 'vue';
import { SNRuntime } from '../../../lib';
import { usePianoStore } from '../stores';
import { usePlayer } from '../use/usePlayer';
import { useGuitarStore } from '../stores/guitar';

/**
 * PanelOperate 组件 props
 * @typedef {Object} PanelOperateProps
 * @property {string=} sheetKey - 乐谱调号
 */
const props = defineProps<{
  sheetKey?: string;
}>();

/**
 * 伴奏开关状态
 */
const isAccompanimentActive = ref(true);

/**
 * 旋律开关状态
 */
const isMelodyActive = ref(true);

/**
 * 固定调（Absolute Pitch）模式开关状态
 * true 表示固定调（不移调），false 表示首调（根据乐谱主调移调）
 */
const isFixedPitchActive = ref(false);

/**
 * 手动选择的移调调式
 */
const selectedTransposeKey = ref('C'); // 默认C调

/**
 * 常见的移调调式列表
 */
const transposeKeys = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
];

/**
 * 选中的乐器类型
 */
const selectedInstrument = ref('piano'); // 默认钢琴

/**
 * 可用的乐器列表
 */
const instruments = [
  {
    name: '钢琴',
    value: 'piano',
  },
  {
    name: '吉他',
    value: 'guitar-acoustic',
  },
]; // 对应 samples 目录下的文件夹名

/**
 * 简谱数字到音名的映射（C调）
 */
const scaleMap = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const baseOctave = 4; // 默认八度

const { playNote, noteNameToMidi, midiToNoteName, transport, setInstrument } =
  useTone();

const emits = defineEmits(['import-file', 'export-file']);

const fileInput = ref<HTMLInputElement | null>(null);

const pianoStore = usePianoStore();
const guitarStore = useGuitarStore();

/**
 * 和弦映射表，支持字母和弦（C、D、E等）和数字和弦（1、2、3等）
 * 可根据需要扩展和弦内容
 * 每个和弦映射为一个音高数组（如C和弦=[C,E,G]）
 */
const chordMap: Record<string, string[]> = {
  // 大三和弦
  C: ['C3', 'E3', 'G3'],
  D: ['D3', 'F#3', 'A3'],
  E: ['E3', 'G#3', 'B3'],
  F: ['F3', 'A3', 'C4'],
  G: ['G3', 'B3', 'D4'],
  A: ['A3', 'C#4', 'E4'],
  B: ['B3', 'D#4', 'F#4'],
  // 小三和弦
  Cm: ['C3', 'Eb3', 'G3'],
  Dm: ['D3', 'F3', 'A3'],
  Em: ['E3', 'G3', 'B3'],
  Fm: ['F3', 'Ab3', 'C4'],
  Gm: ['G3', 'Bb3', 'D4'],
  Am: ['A3', 'C4', 'E4'],
  Bm: ['B3', 'D4', 'F#4'],
  // 大七和弦 maj7
  Cmaj7: ['C3', 'E3', 'G3', 'B3'],
  Dmaj7: ['D3', 'F#3', 'A3', 'C#4'],
  Emaj7: ['E3', 'G#3', 'B3', 'D#4'],
  Fmaj7: ['F3', 'A3', 'C4', 'E4'],
  Gmaj7: ['G3', 'B3', 'D4', 'F#4'],
  Amaj7: ['A3', 'C#4', 'E4', 'G#4'],
  Bmaj7: ['B3', 'D#4', 'F#4', 'A#4'],
  // 小七和弦 m7
  Cm7: ['C3', 'Eb3', 'G3', 'Bb3'],
  Dm7: ['D3', 'F3', 'A3', 'C4'],
  Em7: ['E3', 'G3', 'B3', 'D4'],
  Fm7: ['F3', 'Ab3', 'C4', 'Eb4'],
  Gm7: ['G3', 'Bb3', 'D4', 'F4'],
  Am7: ['A3', 'C4', 'E4', 'G4'],
  Bm7: ['B3', 'D4', 'F#4', 'A4'],
  // 数字和弦（C大调）
  '1': ['C3', 'E3', 'G3'],
  '2': ['D3', 'F3', 'A3'],
  '3': ['E3', 'G3', 'B3'],
  '4': ['F3', 'A3', 'C4'],
  '5': ['G3', 'B3', 'D4'],
  '6': ['A3', 'C4', 'E4'],
  '7': ['B3', 'D4', 'F#4'],
  // 数字小三和弦（C大调）
  '1m': ['C3', 'Eb3', 'G3'],
  '2m': ['D3', 'F3', 'A3'],
  '3m': ['E3', 'G3', 'B3'],
  '4m': ['F3', 'Ab3', 'C4'],
  '5m': ['G3', 'Bb3', 'D4'],
  '6m': ['A3', 'C4', 'E4'],
  '7m': ['B3', 'D4', 'F#4'],
  // 数字大七和弦
  '1maj7': ['C3', 'E3', 'G3', 'B3'],
  '2maj7': ['D3', 'F#3', 'A3', 'C#4'],
  '3maj7': ['E3', 'G#3', 'B3', 'D#4'],
  '4maj7': ['F3', 'A3', 'C4', 'E4'],
  '5maj7': ['G3', 'B3', 'D4', 'F#4'],
  '6maj7': ['A3', 'C#4', 'E4', 'G#4'],
  '7maj7': ['B3', 'D#4', 'F#4', 'A#4'],
  // 数字小七和弦
  '1m7': ['C3', 'Eb3', 'G3', 'Bb3'],
  '2m7': ['D3', 'F3', 'A3', 'C4'],
  '3m7': ['E3', 'G3', 'B3', 'D4'],
  '4m7': ['F3', 'Ab3', 'C4', 'Eb4'],
  '5m7': ['G3', 'Bb3', 'D4', 'F4'],
  '6m7': ['A3', 'C4', 'E4', 'G4'],
  '7m7': ['B3', 'D4', 'F#4', 'A4'],
};

let currentMainKeyIndex: number | null = null;
let currentChordKeyIndexes: number[] = [];
let highlightTimer: number | null = null;

/**
 * 控制导入Tooltip的显示/隐藏
 */
const showTooltip = ref(false);

/**
 * 切换Tooltip的显示状态 (用于移动端点击)
 */
const toggleTooltip = () => {
  showTooltip.value = !showTooltip.value;
};

/**
 * 在点击Tooltip外部时隐藏Tooltip
 */
const hideTooltipOnOutsideClick = (event: MouseEvent) => {
  const tooltipContainer = document.querySelector(
    '.flex.items-center.gap-1.text-sm.relative',
  ); // 获取包含按钮和tooltip的容器
  if (tooltipContainer && !tooltipContainer.contains(event.target as Node)) {
    showTooltip.value = false;
  }
};

// 在组件挂载时添加全局点击监听器
onMounted(() => {
  document.addEventListener('click', hideTooltipOnOutsideClick);
});

// 在组件卸载前移除全局点击监听器
onBeforeUnmount(() => {
  document.removeEventListener('click', hideTooltipOnOutsideClick);
});

/**
 * 切换伴奏激活状态
 */
const toggleAccompaniment = () => {
  isAccompanimentActive.value = !isAccompanimentActive.value;
};

/**
 * 切换旋律激活状态
 */
const toggleMelody = () => {
  isMelodyActive.value = !isMelodyActive.value;
};

/**
 * 切换固定调/首调模式
 */
const togglePitchType = () => {
  isFixedPitchActive.value = !isFixedPitchActive.value;
  // 切换模式时更新 selectedTransposeKey
  if (isFixedPitchActive.value) {
    // 固定调模式下，强制移调到C（即播放C调的音高）
    selectedTransposeKey.value = 'C';
  } else {
    // 首调模式下，移调到乐谱主调（如果存在），否则移调到C
    selectedTransposeKey.value = props.sheetKey || 'C';
  }
};

watch(
  () => props.sheetKey,
  (newKey) => {
    if (!isFixedPitchActive.value) {
      selectedTransposeKey.value = newKey || 'C';
    }
  },
  { immediate: true },
);

// Watch for changes in selectedInstrument and update the Tone.js sampler
watch(
  selectedInstrument,
  (newInstrument) => {
    setInstrument(newInstrument).catch(console.error);
  },
  { immediate: true },
);

/**
 * 获取当前调式的移调半音数（以C为0，D为2，E为4等）
 * 支持大调常用调式
 */
function getTransposeByKey(key: string | undefined): number {
  if (!key) return 0;
  // 支持常见大调和b/#调
  const keyMap: Record<string, number> = {
    C: 0,
    'C#': 1,
    Db: 1,
    D: 2,
    'D#': 3,
    Eb: 3,
    E: 4,
    F: 5,
    'F#': 6,
    Gb: 6,
    G: 7,
    'G#': 8,
    Ab: 8,
    A: 9,
    'A#': 10,
    Bb: 10,
    B: 11,
  };
  // 只取主调部分
  const k = key.replace(/m(aj7)?|m7|7|dim|sus|add|\d+/gi, '');
  return keyMap[k] ?? 0;
}

const { player, playState, init, play, stop, pause, resume } = usePlayer();

/**
 * 播放乐谱，使用钢琴采样音色
 * @returns {Promise<void>}
 */
const playHandle = async () => {
  await init();
  setupPlayerListeners();
  play();
};

/**
 * 设置 player 的事件监听器
 */
function setupPlayerListeners() {
  if (!player.value) return; // Added null check for player
  player.value?.onNotePlay((note, durationSec) => {
    const num = parseInt(note.note.replaceAll(/[()（）]/g, ''), 10);
    let noteName = '';
    if (!isNaN(num) && num >= 1 && num <= 7) {
      noteName = scaleMap[num - 1];
      if (note.upDownCount > 0) noteName += '#'.repeat(note.upDownCount);
      const octave = baseOctave + note.octaveCount;
      noteName += octave;
    }

    // 计算移调半音数
    let transpose = getTransposeByKey(selectedTransposeKey.value);

    // 3. 播放音符（只播放有效音符）
    currentMainKeyIndex = null;
    if (note.note === '0') {
      // 0 表示休止符，清除高亮
      pianoStore.clearHighlightKeys();
      guitarStore.clearHighlightPositions();
    } else if (noteName && isMelodyActive.value) {
      const midi = noteNameToMidi(noteName);
      const playNoteName = midiToNoteName(midi + transpose);
      // 播放主音音符
      playNote(playNoteName, durationSec);
      const key = pianoStore.keys.find((k: any) => k.note === playNoteName);
      if (key) {
        currentMainKeyIndex = key.index;
      }
    }
    // 合并主音和和弦的高亮，并在音符/和弦开始时触发
    // 注意：和弦的高亮键索引在 onChordPlay 中更新
    const merged = [
      ...(currentMainKeyIndex ? [currentMainKeyIndex] : []),
      ...currentChordKeyIndexes,
    ];
    if (merged.length > 0) {
      highlightWithTimeout(Array.from(new Set(merged)), durationSec);
    } else {
      // 如果没有主音和和弦，确保清除高亮（例如处理休止符）
      pianoStore.clearHighlightKeys();
      guitarStore.clearHighlightPositions();
    }
  });
  player.value?.onChordPlay((note, durationSec) => {
    // 清除上次和弦的高亮键索引，准备本次的和弦键
    currentChordKeyIndexes = [];
    let chordNotesToPlay: string[] = [];
    let chordKeyIndexesToHighlight: number[] = [];

    // 计算移调半音数 (与 onNotePlay 中的逻辑相同)
    let transpose = getTransposeByKey(selectedTransposeKey.value);
    if (Array.isArray(note.chord) && isAccompanimentActive.value) {
      note.chord.forEach((chordSymbol) => {
        if (chordMap[chordSymbol]) {
          const chordNotes = chordMap[chordSymbol];
          chordNotesToPlay.push(...chordNotes);
          // 收集和弦音符对应的键索引
          const keys = chordNotes
            .map((chordNote) => {
              const midi = noteNameToMidi(chordNote);
              const playNoteName = midiToNoteName(midi + transpose);
              const key = pianoStore.keys.find(
                (k: any) => k.note === playNoteName,
              );
              return key ? key.index : null;
            })
            .filter((idx) => idx !== null) as number[];
          chordKeyIndexesToHighlight.push(...keys);
        }
      });
    }

    // 在和弦开始时立即更新和弦高亮键索引
    currentChordKeyIndexes = Array.from(new Set(chordKeyIndexesToHighlight));

    // 播放和弦音符
    chordNotesToPlay.forEach((noteToPlay) => {
      const midi = noteNameToMidi(noteToPlay);
      const playNoteName = midiToNoteName(midi + transpose);
      playNote(playNoteName, durationSec * 0.95); // 可以稍微缩短和弦音符时长避免重叠
    });

    // 在处理完和弦并更新 currentChordKeyIndexes 后，再次触发高亮。
    // highlightWithTimeout 内部会处理合并和定时器。
    const merged = [
      ...(currentMainKeyIndex ? [currentMainKeyIndex] : []),
      ...currentChordKeyIndexes,
    ];
    if (merged.length > 0) {
      highlightWithTimeout(Array.from(new Set(merged)), durationSec);
    } else {
      // 如果只有和弦但解析失败（不应该发生），确保清除高亮
      pianoStore.clearHighlightKeys();
      guitarStore.clearHighlightPositions();
    }
  });
  player.value?.onPointerMove((note) => {
    SNPointerLayer.showPointer(`note-${note.index}`);
  });
  player.value?.onEnd(() => {
    // 播放结束时清除高亮和指针
    if (highlightTimer) {
      clearTimeout(highlightTimer);
      highlightTimer = null;
    }
    pianoStore.clearHighlightKeys();
    guitarStore.clearHighlightPositions();
    currentMainKeyIndex = null;
    currentChordKeyIndexes = [];
    transport.stop();
    transport.position = 0;
    SNPointerLayer.clearPointer();
    playState.value = 'idle';
  });
}

/**
 * 暂停播放
 * @returns {void}
 */
const pauseHandle = () => {
  pause();
};

/**
 * 停止播放并重置进度
 * @returns {void}
 */
const stopHandle = () => {
  stop();
  SNPointerLayer.clearPointer();
  if (highlightTimer) {
    clearTimeout(highlightTimer);
    highlightTimer = null;
  }
  pianoStore.clearHighlightKeys();
  guitarStore.clearHighlightPositions();
  currentMainKeyIndex = null;
  currentChordKeyIndexes = [];
};

const resumeHandle = () => {
  resume();
};

const print = () => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  const iframeWindow = iframe.contentWindow;
  if (iframeWindow) {
    const container = document.getElementById('container');
    if (container) {
      // 注入 Bravura 字体 @font-face 和打印样式
      const style = iframeWindow.document.createElement('style');
      style.innerHTML = `
        @font-face {
          font-family: 'Bravura';
          src: url('/font/bravura-latin-400-normal.woff2') format('woff2'),
               url('/font/bravura-latin-400-normal.woff') format('woff');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        body, * {
          font-family: 'Bravura', -apple-system, BlinkMacSystemFont, 'PingFang SC',
            'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial,
            'Hiragino Sans GB', 'Heiti SC', 'WenQuanYi Micro Hei', sans-serif !important;
        }
        @media print {
          @page {
             size: A4;
             margin: 15mm;
          }
          body { margin: 0 !important; padding: 0 !important; }
          #container, svg, svg > g, svg > g > g, [sn-tag^="chord-group-"] { /* Added [sn-tag^="chord-group-"] */
             break-inside: avoid !important;
             page-break-inside: avoid !important; /* Older property for compatibility */
          }
        }
      `;
      iframeWindow.document.head.appendChild(style);

      iframeWindow.document.body.innerHTML = container.innerHTML;
      iframeWindow.document.title = `[SimpleNotation]${SNRuntime.info.title || '未命名曲谱'}`;
      iframeWindow.document.body.style.margin = '0';
      iframeWindow.document.body.style.padding = '0';
      iframeWindow.document.body.style.backgroundColor = '#fff';
      // 延迟打印，确保字体和内容加载渲染
      setTimeout(() => {
        iframeWindow.focus();
        iframeWindow.print();
        document.body.removeChild(iframe);
      }, 2000); // Increased timeout again
    }
  }
};

/**
 * 触发导出事件，由父组件处理导出逻辑
 */
function emitExport() {
  emits('export-file');
}

/**
 * 触发文件选择
 */
function triggerImport() {
  fileInput.value?.click();
}

/**
 * 文件选择后读取内容并emit给父组件
 * @param {Event} e
 */
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || !input.files.length) return;
  const file = input.files[0];
  const reader = new FileReader();

  // Check file extension
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.json') || fileName.endsWith('.txt')) {
    // For text files, read as text
    reader.onload = (ev) => {
      emits('import-file', file, ev.target?.result, file.type);
      input.value = ''; // Clear input value after file selection
    };
    reader.readAsText(file);
  } else if (fileName.endsWith('.mid') || fileName.endsWith('.midi')) {
    // For MIDI files, read as ArrayBuffer
    reader.onload = (ev) => {
      emits('import-file', file, ev.target?.result, file.type);
      input.value = ''; // Clear input value after file selection
    };
    reader.readAsArrayBuffer(file);
  } else {
    // Handle unsupported file types if necessary
    console.warn('Unsupported file type selected:', file.type);
    input.value = ''; // Clear input value even for unsupported types
  }
}

function highlightWithTimeout(keys: number[], durationSec: number) {
  pianoStore.setHighlightKeys(keys);
  guitarStore.setHighlightKeys(keys);
  if (highlightTimer) {
    clearTimeout(highlightTimer);
    highlightTimer = null;
  }
  highlightTimer = window.setTimeout(() => {
    pianoStore.clearHighlightKeys();
    guitarStore.clearHighlightPositions();
    highlightTimer = null;
  }, durationSec * 1000);
}

// 暴露方法到模板
// @ts-ignore
defineExpose({ play, stop, print, pause, resume });
</script>
