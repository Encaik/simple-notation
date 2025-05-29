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
          @change="onTransposeKeyChange"
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

const {
  transpose,
  setTranspose,
  playNote,
  noteNameToMidi,
  midiToNoteName,
  transport,
  setInstrument,
} = useTone();

const emits = defineEmits(['import-file', 'export-file']);

const fileInput = ref<HTMLInputElement | null>(null);

const pianoStore = usePianoStore();
const guitarStore = useGuitarStore();

let currentMainKeyMidi: number | null = null;
// 用于管理旋律高亮的定时器
let melodyHighlightTimer: number | null = null;
// 用于管理和弦高亮的定时器
let chordHighlightTimer: number | null = null;

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
    setTranspose(0);
  } else {
    // 首调模式下，移调到乐谱主调（如果存在），否则移调到C
    selectedTransposeKey.value = props.sheetKey || 'C';
    const transposeValue = getTransposeByKey(selectedTransposeKey.value);
    setTranspose(transposeValue);
  }
};

watch(
  () => props.sheetKey,
  (newKey) => {
    if (!isFixedPitchActive.value) {
      selectedTransposeKey.value = newKey || 'C';
      const transposeValue = getTransposeByKey(selectedTransposeKey.value);
      setTranspose(transposeValue);
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

function onTransposeKeyChange() {
  const transposeValue = getTransposeByKey(selectedTransposeKey.value);
  setTranspose(transposeValue);
}

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
  if (!player.value) return;
  player.value?.onNotePlay((note, durationSec) => {
    // 将简谱数字转换为音名
    const num = parseInt(note.note.replaceAll(/[()（）]/g, ''), 10);
    let noteName = '';
    // 如果是1-7的简谱数字，查找对应的音名并处理升降号和八度
    if (!isNaN(num) && num >= 1 && num <= 7) {
      noteName = scaleMap[num - 1];
      if (note.upDownCount > 0) noteName += '#'.repeat(note.upDownCount); // 处理升号
      // 注意：这里简谱的八度表示方式可能需要根据实际情况调整
      const octave = baseOctave + note.octaveCount; // 根据八度记号调整八度
      noteName += octave;
    }

    // 播放音符并处理高亮（只播放有效的、属于旋律部分的音符）
    currentMainKeyMidi = null; // 重置当前主音 MIDI

    // 旋律音播放时，清除当前旋律高亮和其定时器，但不影响和弦高亮
    clearMelodyHighlightsAndTimer();

    if (note.note === '0') {
      // 0 表示休止符，清除所有高亮和定时器
      clearAllHighlightsAndTimers(); // 清除所有，包括可能的和弦高亮
    } else if (noteName && isMelodyActive.value) {
      // 如果是有效的旋律音符且旋律功能激活
      const midi = noteNameToMidi(noteName); // 获取音符的 MIDI 值
      // 应用移调后获取实际播放的音名
      const playNoteName = midiToNoteName(midi + transpose.value);
      playNote(playNoteName, durationSec); // 播放音符
      currentMainKeyMidi = midi + transpose.value; // 记录当前播放的移调后的主音 MIDI

      // 设置旋律高亮并安排清除
      pianoStore.setHighlightMidis([currentMainKeyMidi], 'melody'); // 指定类型为 melody
      guitarStore.setHighlightMidis([currentMainKeyMidi]);
      scheduleMelodyHighlightClear(durationSec); // 调用旋律高亮清除函数
    } else {
      // 如果是非旋律音符（例如和弦分解中的音）或休止符
      // 对于非旋律音符，不设置旋律高亮，确保清除旧的旋律高亮
      clearMelodyHighlightsAndTimer();
    }
  });

  // 监听和弦播放事件 (主要用于伴奏部分)
  player.value?.onChordPlay((note, durationSec) => {
    clearChordHighlightsAndTimer();

    // 如果有和弦符号且伴奏功能激活
    if (Array.isArray(note.chord) && isAccompanimentActive.value) {
      let allNotesToPlay: string[] = []; // 收集所有需要播放的音符

      // 由 Piano Store 处理和弦，获取钢琴需要播放的音符并触发钢琴和弦高亮
      // processChord 方法内部会调用 pianoStore.setHighlightMidis(..., 'chord')
      const pianoNotesToPlay = pianoStore.processChord(note.chord);
      allNotesToPlay.push(...pianoNotesToPlay);

      // 由 Guitar Store 处理和弦，获取吉他需要播放的音符并触发吉他和弦高亮 (基于和弦图谱)
      // processChord 方法内部会调用 guitarStore.setGuitarPositions(..., 'chord')
      const guitarNotesToPlay = guitarStore.processChord(note.chord);
      allNotesToPlay.push(...guitarNotesToPlay);

      // 播放所有收集到的音符（去重）
      Array.from(new Set(allNotesToPlay)).forEach((noteToPlay) => {
        // 应用移调后播放音符
        const midi = noteNameToMidi(noteToPlay);
        const playNoteName = midiToNoteName(midi + transpose.value);
        // 使用稍微短的时长模拟扫弦效果
        playNote(playNoteName, durationSec * 0.95);
      });

      // 安排和弦高亮在持续时间后清除
      scheduleChordHighlightClear(durationSec); // 调用和弦高亮清除函数
    } else {
      // 如果没有播放和弦或者伴奏功能未激活，清除和弦高亮和其定时器
      clearChordHighlightsAndTimer();
    }
  });

  // 监听指针移动事件，显示当前播放位置的指针
  player.value?.onPointerMove((note) => {
    SNPointerLayer.showPointer(`note-${note.index}`);
  });

  // 监听播放结束事件
  player.value?.onEnd(() => {
    // 播放结束时清除所有高亮、指针，并停止 Tone.js 传输
    clearAllHighlightsAndTimers(); // 调用清除所有高亮和定时器的函数
    currentMainKeyMidi = null;
    transport.stop();
    transport.position = 0; // 重置播放位置
    SNPointerLayer.clearPointer();
    playState.value = 'idle'; // 更新播放状态为停止
  });
}

/**
 * 清除所有当前旋律高亮和旋律高亮清除定时器。
 */
function clearMelodyHighlightsAndTimer() {
  pianoStore.clearMelodyHighlightMidis();
  guitarStore.clearMelodyHighlightMidis();
  if (melodyHighlightTimer) {
    clearTimeout(melodyHighlightTimer);
    melodyHighlightTimer = null;
  }
}

/**
 * 安排旋律高亮在指定持续时间后清除。
 * 在设置新的旋律高亮时调用此函数。它会取消之前安排的任何旋律清除操作。
 * @param {number} durationSec - 高亮持续时间（秒）。
 */
function scheduleMelodyHighlightClear(durationSec: number) {
  if (melodyHighlightTimer) {
    clearTimeout(melodyHighlightTimer);
    melodyHighlightTimer = null;
  }
  melodyHighlightTimer = window.setTimeout(() => {
    pianoStore.clearMelodyHighlightMidis();
    guitarStore.clearMelodyHighlightMidis();
    melodyHighlightTimer = null;
  }, durationSec * 1000);
}

/**
 * 清除所有当前和弦高亮和和弦高亮清除定时器。
 */
function clearChordHighlightsAndTimer() {
  pianoStore.clearChordHighlightMidis();
  guitarStore.clearChordHighlightMidis();
  if (chordHighlightTimer) {
    clearTimeout(chordHighlightTimer);
    chordHighlightTimer = null;
  }
}

/**
 * 安排和弦高亮在指定持续时间后清除。
 * 在设置新的和弦高亮时调用此函数。它会取消之前安排的任何和弦清除操作。
 * @param {number} durationSec - 高亮持续时间（秒）。
 */
function scheduleChordHighlightClear(durationSec: number) {
  if (chordHighlightTimer) {
    clearTimeout(chordHighlightTimer);
    chordHighlightTimer = null;
  }
  chordHighlightTimer = window.setTimeout(() => {
    pianoStore.clearChordHighlightMidis();
    guitarStore.clearChordHighlightMidis();
    chordHighlightTimer = null;
  }, durationSec * 1000);
}

/**
 * 清除所有高亮和任何 pending 的高亮清除定时器（旋律和和弦）。
 */
function clearAllHighlightsAndTimers() {
  clearMelodyHighlightsAndTimer();
  clearChordHighlightsAndTimer();
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
  // 清除所有高亮和定时器
  clearAllHighlightsAndTimers(); // 调用清除所有高亮和定时器的函数
  currentMainKeyMidi = null; // 重置主音 MIDI
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
</script>
