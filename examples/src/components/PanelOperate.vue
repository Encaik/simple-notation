<template>
  <div
    class="max-w-[1200px] w-full mt-5 mx-auto bg-white bg-opacity-95 p-5 rounded-lg shadow-md flex flex-col gap-4 overflow-hidden box-border hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
  >
    <div class="flex flex-row flex-wrap items-center gap-[10px]">
      <button
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-25 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 hover:border-[#ff6b3d] transition-colors duration-200"
        @click="print"
        :disabled="isPrinting"
      >
        {{ isPrinting ? '⏳保存中...' : '💾保存pdf' }}
      </button>
      <button
        class="py-2 px-3 border border-[#7b5aff] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#7b5aff] focus:ring-2 focus:ring-opacity-10 focus:ring-[#7b5aff] hover:bg-opacity-90 hover:border-[#6a4ac9] transition-colors duration-200"
        @click="handleNew"
      >
        📝新建
      </button>
      <button
        v-if="playState === 'idle'"
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 hover:border-[#ff6b3d] transition-colors duration-200"
        @click="playHandle"
      >
        ▶️播放
      </button>
      <button
        v-if="playState === 'playing'"
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 hover:border-[#ff6b3d] transition-colors duration-200"
        @click="pauseHandle"
      >
        ⏸️暂停
      </button>
      <button
        v-if="playState === 'paused'"
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 hover:border-[#ff6b3d] transition-colors duration-200"
        @click="resumeHandle"
      >
        ▶️继续
      </button>
      <button
        v-if="playState === 'playing' || playState === 'paused'"
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 hover:border-[#ff6b3d] transition-colors duration-200"
        @click="stopHandle"
      >
        ⏹️停止
      </button>
      <button
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 hover:border-[#ff6b3d] transition-colors duration-200"
        @click="emitExport"
      >
        📤导出
      </button>
      <div class="flex items-center gap-1 text-sm relative">
        <button
          ref="importBtnRef"
          class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 hover:border-[#ff6b3d] transition-colors duration-200"
          @click="triggerImport"
          @mouseenter="
            showTooltip = true;
            updateTooltipPosition();
          "
          @mouseleave="showTooltip = false"
        >
          📥导入
        </button>
        <div
          class="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold cursor-pointer relative"
          @mouseenter="
            showTooltip = true;
            updateTooltipPosition();
          "
          @mouseleave="showTooltip = false"
          @click.stop="toggleTooltip"
        >
          ?
        </div>
        <teleport to="body">
          <div
            v-if="showTooltip"
            :style="tooltipStyle"
            class="z-50 text-left p-2 bg-black text-white text-xs rounded shadow-lg min-w-[160px] max-w-[220px] box-border"
          >
            支持导入：<br />
            <div>.json(模板语法导出文件)</div>
            <div>.txt (ABC谱文本文件)</div>
            <div>.mp3 (音频文件，自动音高分析)</div>
            <div>.mid, .midi (MIDI文件)</div>
          </div>
        </teleport>
      </div>
      <button
        class="py-2 px-3 border rounded text-sm cursor-pointer min-h-auto box-border w-24 focus:outline-none focus:ring-2 focus:ring-opacity-10 transition-colors duration-200"
        :class="
          isAccompanimentActive
            ? 'bg-[#7b5aff] text-white border-[#7b5aff] focus:border-[#7b5aff] focus:ring-[#7b5aff] hover:bg-[#6a4ac9] hover:border-[#6a4ac9]'
            : 'bg-white bg-opacity-80 border-[#ddd] focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 hover:border-[#ff6b3d]'
        "
        @click="toggleAccompaniment"
      >
        {{ isAccompanimentActive ? '✅' : '❌' }}伴奏
      </button>
      <button
        class="py-2 px-3 border rounded text-sm cursor-pointer min-h-auto box-border w-24 focus:outline-none focus:ring-2 focus:ring-opacity-10 transition-colors duration-200"
        :class="
          isMelodyActive
            ? 'bg-[#7b5aff] text-white border-[#7b5aff] focus:border-[#7b5aff] focus:ring-[#7b5aff] hover:bg-[#6a4ac9] hover:border-[#6a4ac9]'
            : 'bg-white bg-opacity-80 border-[#ddd] focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 hover:border-[#ff6b3d]'
        "
        @click="toggleMelody"
      >
        {{ isMelodyActive ? '✅' : '❌' }}旋律
      </button>
      <button
        class="py-2 px-3 border rounded text-sm cursor-pointer min-h-auto box-border w-24 focus:outline-none focus:ring-2 focus:ring-opacity-10 transition-colors duration-200"
        :class="
          isFixedPitchActive
            ? 'bg-[#7b5aff] text-white border-[#7b5aff] focus:border-[#7b5aff] focus:ring-[#7b5aff] hover:bg-[#6a4ac9] hover:border-[#6a4ac9]'
            : 'bg-[#ff6b3d] text-white border-[#ff6b3d] focus:border-[#ff6b3d] focus:ring-[#ff6b3d] hover:bg-[#ff5a2c] hover:border-[#ff5a2c]'
        "
        @click="togglePitchType"
      >
        {{ isFixedPitchActive ? '固定调' : '首调' }}
      </button>

      <!-- 自动滚动按钮 -->
      <button
        class="py-2 px-3 border rounded text-sm cursor-pointer min-h-auto box-border w-30 focus:outline-none focus:ring-2 focus:ring-opacity-10 transition-colors duration-200"
        :class="
          isAutoScrollActive
            ? 'bg-[#7b5aff] text-white border-[#7b5aff] focus:border-[#7b5aff] focus:ring-[#7b5aff] hover:bg-[#6a4ac9] hover:border-[#6a4ac9]'
            : 'bg-white bg-opacity-80 border-[#ddd] focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 hover:border-[#ff6b3d]'
        "
        @click="toggleAutoScroll"
      >
        {{ isAutoScrollActive ? '✅' : '❌' }}自动滚动
      </button>

      <!-- 节拍器按钮 -->
      <button
        class="py-2 px-3 border rounded text-sm cursor-pointer min-h-auto box-border w-24 focus:outline-none focus:ring-2 focus:ring-opacity-10 transition-colors duration-200"
        :class="
          isMetronomeActive
            ? 'bg-[#7b5aff] text-white border-[#7b5aff] focus:border-[#7b5aff] focus:ring-[#7b5aff] hover:bg-[#6a4ac9] hover:border-[#6a4ac9]'
            : 'bg-white bg-opacity-80 border-[#ddd] focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90 hover:border-[#ff6b3d]'
        "
        @click="toggleMetronome"
      >
        {{ isMetronomeActive ? '✅' : '❌' }}节拍器
      </button>

      <!-- 独立节拍器 tempo 输入 (仅在乐谱不播放时显示) -->
      <div
        v-if="playState === 'idle' && isMetronomeActive"
        class="flex items-center gap-1 text-sm"
      >
        <label for="metronome-tempo">Tempo:</label>
        <input
          id="metronome-tempo"
          type="number"
          v-model.number="metronomeTempo"
          min="40"
          max="300"
          @change="updateStandaloneMetronomeTempo"
          class="p-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90"
        />
      </div>

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
        accept=".json,.txt,.mid,.midi,.mp3"
        style="display: none"
        @change="onFileChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SNPointerLayer } from '@layers';
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useTone } from '../use/useTone';
import { defineEmits, defineProps } from 'vue';
import { SNRuntime, SNTransition } from '../../../lib';
import { useGuitarStore, usePianoStore, useHarmonicaStore } from '../stores';
import { usePlayer } from '../use/usePlayer';
import { snapdom } from '@zumer/snapdom';
import jsPDF from 'jspdf';

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
 * 自动滚动开关状态
 */
const isAutoScrollActive = ref(true);

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
  {
    name: '口琴',
    value: 'harmonium',
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
  startStandaloneMetronome,
  stopStandaloneMetronome,
} = useTone();

const emits = defineEmits(['import-file', 'export-file', 'new-sheet']);

const fileInput = ref<HTMLInputElement | null>(null);

const pianoStore = usePianoStore();
const guitarStore = useGuitarStore();
const harmonicaStore = useHarmonicaStore();

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
 * 导入按钮的ref
 */
const importBtnRef = ref<HTMLElement | null>(null);

/**
 * tooltip的样式对象，动态计算fixed定位，所有属性均为字符串，包含zIndex
 * @type {import('vue').Ref<Record<string, string>>}
 */
const tooltipStyle = ref<Record<string, string>>({
  left: '0px',
  top: '0px',
  position: 'fixed',
  zIndex: '9999',
});

/**
 * 计算tooltip的fixed定位，保证不被裁剪
 * @returns {void}
 */
function updateTooltipPosition() {
  nextTick(() => {
    const btn = importBtnRef.value;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    // tooltip默认在按钮右侧居中
    let left = rect.right + 24;
    let top = rect.top + rect.height / 2;
    // 先计算宽高，假设最大宽度220
    const tooltipWidth = 220;
    const tooltipHeight = 110;
    // 判断右侧是否溢出
    if (left + tooltipWidth > window.innerWidth - 8) {
      left = rect.left - tooltipWidth - 8;
    }
    // 判断上方/下方是否溢出
    let finalTop = top - tooltipHeight / 2;
    if (finalTop < 8) finalTop = 8;
    if (finalTop + tooltipHeight > window.innerHeight - 8) {
      finalTop = window.innerHeight - tooltipHeight - 8;
    }
    tooltipStyle.value = {
      left: left + 'px',
      top: finalTop + 'px',
      position: 'fixed',
      zIndex: '9999',
    };
  });
}

/**
 * 切换Tooltip的显示状态 (用于移动端点击)
 */
const toggleTooltip = () => {
  showTooltip.value = !showTooltip.value;
  if (showTooltip.value) updateTooltipPosition();
};

/**
 * 在点击Tooltip外部时隐藏Tooltip
 */
const hideTooltipOnOutsideClick = (event: MouseEvent) => {
  // 判断点击是否在tooltip或按钮内
  const btn = importBtnRef.value;
  const tooltipEl = document.querySelector('.z-50.text-left.p-2.bg-black');
  if (btn && btn.contains(event.target as Node)) {
    return;
  }
  if (tooltipEl && tooltipEl.contains(event.target as Node)) {
    return;
  }
  showTooltip.value = false;
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
 * 切换自动滚动激活状态
 */
const toggleAutoScroll = () => {
  isAutoScrollActive.value = !isAutoScrollActive.value;
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
    const transposeValue = SNTransition.General.getTransposeByKey(
      selectedTransposeKey.value,
    );
    setTranspose(transposeValue);
  }
};

watch(
  () => props.sheetKey,
  (newKey) => {
    if (!isFixedPitchActive.value) {
      selectedTransposeKey.value = newKey || 'C';
      const transposeValue = SNTransition.General.getTransposeByKey(
        selectedTransposeKey.value,
      );
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
  const transposeValue = SNTransition.General.getTransposeByKey(
    selectedTransposeKey.value,
  );
  setTranspose(transposeValue);
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
  player.value?.onNotePlay((note, duration) => {
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
      playNote(playNoteName, duration * 0.001); // 播放音符
      currentMainKeyMidi = midi + transpose.value; // 记录当前播放的移调后的主音 MIDI

      // 设置旋律高亮并安排清除
      pianoStore.setHighlightMidis([currentMainKeyMidi]);
      guitarStore.setHighlightMidis([currentMainKeyMidi]);
      harmonicaStore.setHighlightMidis([currentMainKeyMidi]);
      scheduleMelodyHighlightClear(duration * 0.001); // 调用旋律高亮清除函数
    } else {
      // 如果是非旋律音符（例如和弦分解中的音）或休止符
      // 对于非旋律音符，不设置旋律高亮，确保清除旧的旋律高亮
      clearMelodyHighlightsAndTimer();
    }
  });

  // 监听和弦播放事件 (主要用于伴奏部分)
  player.value?.onChordPlay((note, duration) => {
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

      // 和弦释放额外时长，用于模拟扫弦效果
      const chordReleaseExtra = 0.15;

      // 播放所有收集到的音符（去重）
      Array.from(new Set(allNotesToPlay)).forEach((noteToPlay) => {
        // 应用移调后播放音符
        const midi = noteNameToMidi(noteToPlay);
        const playNoteName = midiToNoteName(midi + transpose.value);
        playNote(playNoteName, duration * 0.001 + chordReleaseExtra);
      });

      // 安排和弦高亮在持续时间后清除
      scheduleChordHighlightClear(duration * 0.001 + chordReleaseExtra); // 调用和弦高亮清除函数
    } else {
      // 如果没有播放和弦或者伴奏功能未激活，清除和弦高亮和其定时器
      clearChordHighlightsAndTimer();
    }
  });

  // 监听指针移动事件，显示当前播放位置的指针
  player.value?.onPointerMove((note) => {
    SNPointerLayer.showPointer(`note-${note.index}`);

    // 如果自动滚动激活，将当前音符滚动到视口内
    if (isAutoScrollActive.value) {
      const container = document.getElementById('container'); // 获取乐谱容器
      const noteElement = document.querySelector(
        `[sn-tag="note-${note.index}"]`,
      ); // 获取当前音符对应的DOM元素
      if (container && noteElement) {
        const containerRect = container.getBoundingClientRect();
        const noteRect = noteElement.getBoundingClientRect();
        const containerHeight = containerRect.height;
        const noteHeight = noteRect.height;
        const noteTopRelativeToContainerViewport =
          noteRect.top - containerRect.top;
        const desiredBottomMargin = 160; // 设置距离容器底部视口的期望像素值
        const desiredTopMargin = 160; // 设置距离容器顶部视口的期望像素值
        const desiredNoteBottomRelativeToContainerViewport =
          containerHeight - desiredBottomMargin;
        const currentNoteBottomRelativeToContainerViewport =
          noteTopRelativeToContainerViewport + noteHeight;
        let scrollDelta = 0;
        if (noteTopRelativeToContainerViewport < desiredTopMargin) {
          scrollDelta = noteTopRelativeToContainerViewport - desiredTopMargin;
        } else if (
          currentNoteBottomRelativeToContainerViewport >
          desiredNoteBottomRelativeToContainerViewport
        ) {
          scrollDelta =
            currentNoteBottomRelativeToContainerViewport -
            desiredNoteBottomRelativeToContainerViewport;
        } else {
          return;
        }
        const currentScrollTop = container.scrollTop;
        const targetScrollTop = currentScrollTop + scrollDelta;
        const maxScrollTop = container.scrollHeight - containerHeight;
        const finalScrollTop = Math.max(
          0,
          Math.min(targetScrollTop, maxScrollTop),
        );
        if (finalScrollTop !== currentScrollTop) {
          container.scrollTo({
            top: finalScrollTop,
            behavior: 'smooth',
          });
        }
      }
    }
  });

  // 监听播放结束事件
  player.value?.onEnd(() => {
    clearAllHighlightsAndTimers(); // 调用清除所有高亮和定时器的函数
    currentMainKeyMidi = null;
    transport.stop();
    transport.position = 0; // 重置播放位置
    SNPointerLayer.clearPointer();
    playState.value = 'idle'; // 更新播放状态为停止
    if (isMetronomeActive.value) {
      startStandaloneMetronome(Number(metronomeTempo.value)); // Restart in standalone mode with current tempo
    }
  });
}

/**
 * 清除所有当前旋律高亮和旋律高亮清除定时器。
 */
function clearMelodyHighlightsAndTimer() {
  pianoStore.clearMelodyHighlightMidis();
  guitarStore.clearMelodyHighlightMidis();
  harmonicaStore.clearMelodyHighlightMidis();
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
    harmonicaStore.clearMelodyHighlightMidis();
    melodyHighlightTimer = null;
  }, durationSec * 1000);
}

/**
 * 清除所有当前和弦高亮和和弦高亮清除定时器。
 */
function clearChordHighlightsAndTimer() {
  pianoStore.clearChordHighlightMidis();
  guitarStore.clearChordHighlightMidis();
  harmonicaStore.clearChordHighlightMidis();
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
    harmonicaStore.clearChordHighlightMidis();
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

/**
 * 打印乐谱功能：获取乐谱容器的高度，根据分页符（`sn-tag="break-line"`）将乐谱内容分割成多页，
 * 然后逐页将内容转换为图片并保存为PDF。
 * 此功能需要借助第三方库 `html2canvas` 和 `jspdf`。
 * @returns {Promise<void>}
 */
const print = async () => {
  const container = document.getElementById('container');
  if (container) {
    isPrinting.value = true; // 开始打印，设置加载状态为 true
    const originalScrollTop = container.scrollTop; // 记录原始滚动位置
    // 临时设置容器的 overflow 为 visible，确保 html2canvas 可以捕获所有内容
    // 并记录原始样式，以便之后恢复
    const originalOverflow = container.style.overflow;
    container.style.overflow = 'visible';
    // 临时移除可能影响布局的 max-height 或 height 属性，确保所有内容都"可见"
    const originalMaxHeight = container.style.maxHeight;
    container.style.maxHeight = 'none';

    // 确保所有自定义字体（包括Bravura）都已加载
    /**
     * 等待所有自定义字体加载完成。
     * 这一步对于snapdom正确渲染页面中的自定义字体至关重要，
     * 尤其是像Bravura这种通过@font-face加载的乐谱字体。
     */
    await document.fonts.ready;

    // 获取乐谱容器的总高度 (此时已考虑所有内容，因为 overflow 为 visible)
    const containerHeight = container.scrollHeight;
    const breakLines = document.querySelectorAll('[sn-tag="break-line"]'); // 获取所有分页符元素
    const pageBreakYPositions: number[] = [0]; // 存储每一页的起始Y坐标，初始为容器顶部

    // 遍历所有分页符，收集它们相对于容器顶部的Y坐标
    breakLines.forEach((element) => {
      const relativeTop =
        element.getBoundingClientRect().top -
        container.getBoundingClientRect().top; // 修正：当 overflow 为 visible 时，直接计算相对位置
      pageBreakYPositions.push(relativeTop);
    });

    // 添加容器底部作为最后一页的结束Y坐标
    pageBreakYPositions.push(containerHeight);

    // 使用snapdom捕获整个容器的内容到一张大画布上
    let fullCanvas: HTMLCanvasElement | null = null;
    try {
      // snapdom返回一个Promise，解析为一个包含toCanvas方法的对象
      const result = await snapdom(container, {
        embedFonts: false, // 确保嵌入字体
        scale: 2, // 提高分辨率
        backgroundColor: '#fff', // 设置背景色，避免透明背景
      });
      fullCanvas = await result.toCanvas();
      console.log('成功捕获整个乐谱到画布');
    } catch (error) {
      console.error('捕获整个乐谱到画布时出错:', error);
      // 恢复原始样式并退出
      container.style.overflow = originalOverflow;
      container.style.maxHeight = originalMaxHeight;
      container.scrollTop = originalScrollTop;
      return;
    }

    // 恢复容器的原始 overflow 和 maxHeight 样式
    container.style.overflow = originalOverflow;
    container.style.maxHeight = originalMaxHeight;

    if (!fullCanvas) return; // 如果捕获失败，则退出

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const margin = 0; // 页边距
    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    // const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 已声明但未读取其值，故注释掉

    // 遍历页面分割点，从大画布上切割每一页并添加到PDF
    for (let i = 0; i < pageBreakYPositions.length - 1; i++) {
      const startY = pageBreakYPositions[i]; // 当前页在大画布上的起始Y坐标
      const endY = pageBreakYPositions[i + 1]; // 当前页在大画布上的结束Y坐标
      let segmentHeight = endY - startY; // 当前页的高度

      if (segmentHeight <= 0) continue; // 忽略无效页面高度

      // 创建一个临时画布来绘制当前页的内容
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      if (!pageCtx) continue; // 如果获取不到上下文，跳过

      // 根据 fullCanvas 的缩放比例调整 pageCanvas 的尺寸
      const scaleFactor = fullCanvas.width / container.offsetWidth; // 使用 container.offsetWidth for consistency
      const scaledSegmentHeight = segmentHeight * scaleFactor; // Corrected height
      const scaledStartY = startY * scaleFactor;

      pageCanvas.width = fullCanvas.width; // 保持宽度与fullCanvas一致
      pageCanvas.height = scaledSegmentHeight; // 设置高度为当前页的缩放高度

      // 从 fullCanvas 截取当前页的内容到 pageCanvas
      pageCtx.drawImage(
        fullCanvas,
        0, // sourceX
        scaledStartY, // sourceY, 考虑缩放
        fullCanvas.width, // sourceWidth
        scaledSegmentHeight, // sourceHeight
        0, // destX
        0, // destY
        pageCanvas.width, // destWidth
        pageCanvas.height, // destHeight
      );

      const imgData = pageCanvas.toDataURL('image/png');
      const imgWidth = pdfPageWidth - 2 * margin; // PDF页宽 - 左右边距
      // 根据图片原始比例计算在PDF中的高度
      const imgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;

      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'PNG', margin, margin + 10, imgWidth, imgHeight);

      // 在每页底部中间添加页码
      pdf.setFontSize(10); // 设置字体大小
      const pageNumberText = `- ${i + 1} -`;
      const textWidth =
        (pdf.getStringUnitWidth(pageNumberText) * pdf.getFontSize()) /
        pdf.internal.scaleFactor;
      const x = (pdfPageWidth - textWidth) / 2;
      const y = pdf.internal.pageSize.getHeight() - 15; // 距离底部15mm
      pdf.text(pageNumberText, x, y);

      console.log(`成功切割并添加第 ${i + 1} 页到PDF`);
    }

    // 保存PDF文件
    pdf.save(`[SimpleNotation]${SNRuntime.info.title || '未命名曲谱'}.pdf`);

    // 恢复容器的原始滚动位置
    container.scrollTop = originalScrollTop;
  }
  isPrinting.value = false; // 打印完成或发生错误，设置加载状态为 false
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
  } else if (fileName.endsWith('.mp3')) {
    // mp3文件，读取为ArrayBuffer
    reader.onload = (ev) => {
      emits('import-file', file, ev.target?.result, file.type);
      input.value = '';
    };
    reader.readAsArrayBuffer(file);
  } else {
    // Handle unsupported file types if necessary
    console.warn('Unsupported file type selected:', file.type);
    input.value = ''; // Clear input value even for unsupported types
  }
}

/**
 * 节拍器开关状态
 */
const isMetronomeActive = ref(false);

/**
 * 打印操作的加载状态
 */
const isPrinting = ref(false);

/**
 * 独立节拍器模式下的 Tempo
 */
const metronomeTempo = ref(Number(SNRuntime.info?.tempo) || 120); // Default tempo is sheet tempo or 120

/**
 * 切换节拍器激活状态
 */
const toggleMetronome = () => {
  isMetronomeActive.value = !isMetronomeActive.value;
  if (isMetronomeActive.value) {
    metronomeTempo.value =
      Number(SNRuntime.info?.tempo) || metronomeTempo.value;
    startStandaloneMetronome(metronomeTempo.value);
  } else {
    stopStandaloneMetronome();
  }
};

/**
 * 更新独立节拍器模式下的 Tempo
 */
const updateStandaloneMetronomeTempo = () => {
  stopStandaloneMetronome();
  metronomeTempo.value = Number(SNRuntime.info?.tempo) || metronomeTempo.value;
  startStandaloneMetronome(metronomeTempo.value);
};

/**
 * 处理新建乐谱
 */
function handleNew() {
  emits('new-sheet');
}
</script>
