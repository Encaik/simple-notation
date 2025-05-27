<template>
  <div
    class="max-w-[1200px] w-full mt-5 mx-auto bg-white bg-opacity-95 p-5 rounded-lg shadow-md flex flex-col gap-4 overflow-hidden box-border hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
  >
    <div class="flex flex-row items-center gap-[10px]">
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
      <button
        class="py-2 px-3 border border-[#ddd] rounded text-sm bg-white bg-opacity-80 cursor-pointer min-h-auto box-border w-20 focus:outline-none focus:border-[#ff6b3d] focus:ring-2 focus:ring-opacity-10 focus:ring-[#ff6b3d] hover:bg-opacity-90"
        @click="triggerImport"
      >
        📥导入
      </button>
      <!-- <button
        class="py-2 px-3 border rounded text-sm cursor-pointer min-h-auto box-border w-24 focus:outline-none focus:ring-2 focus:ring-opacity-10 transition-colors duration-200"
        :class="
          isMetronomeActive
            ? 'bg-[#7b5aff] text-white border-[#7b5aff] focus:border-[#7b5aff] focus:ring-[#7b5aff] hover:bg-[#6a4ac9]'
            : 'bg-white bg-opacity-80 border-[#ddd] focus:border-[#ff6b3d] focus:ring-[#ff6b3d] hover:bg-opacity-90'
        "
        @click="toggleMetronome"
      >
        {{ isMetronomeActive ? '✅' : '❌' }}节拍器
      </button> -->
      <input
        ref="fileInput"
        type="file"
        accept=".json,.txt"
        style="display: none"
        @change="onFileChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SNPointerLayer } from '@layers';
import { ref } from 'vue';
import { useTone } from '../use/useTone';
import { defineEmits } from 'vue';
import { SNRuntime } from '../../../lib';
import { usePianoStore } from '../stores';
import { usePlayer } from '../use/usePlayer';

/**
 * 简谱数字到音名的映射（C调）
 */
const scaleMap = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const baseOctave = 4; // 默认八度

const { playNote, noteNameToMidi, midiToNoteName, transport } = useTone();

const emits = defineEmits(['import-file', 'export-file']);

const fileInput = ref<HTMLInputElement | null>(null);

const pianoStore = usePianoStore();

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

// 节拍器相关状态和变量 (仅保留状态)
// const isMetronomeActive = ref(false);

/**
 * 切换节拍器激活状态 (暂无逻辑)
 */
// const toggleMetronome = () => {
//   isMetronomeActive.value = !isMetronomeActive.value;
//   console.log('Metronome toggle:', isMetronomeActive.value);
// };

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
 * 打印乐谱
 */

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
    // 获取当前调式移调
    const transpose = getTransposeByKey(SNRuntime.info?.key);
    // 3. 播放音符（只播放有效音符）
    currentMainKeyIndex = null;
    if (note.note === '0') {
      // 0 表示休止符，清除高亮
      pianoStore.clearHighlightKeys();
    } else if (noteName) {
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
    }
  });
  player.value?.onChordPlay((note, durationSec) => {
    // 清除上次和弦的高亮键索引，准备本次的和弦键
    currentChordKeyIndexes = [];
    const transpose = getTransposeByKey(SNRuntime.info?.key);
    let chordNotesToPlay: string[] = [];
    let chordKeyIndexesToHighlight: number[] = [];

    if (Array.isArray(note.chord)) {
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
  reader.onload = (ev) => {
    emits('import-file', file, ev.target?.result);
    input.value = '';
  };
  reader.readAsText(file);
}

function highlightWithTimeout(keys: number[], durationSec: number) {
  pianoStore.setHighlightKeys(keys);
  if (highlightTimer) {
    clearTimeout(highlightTimer);
    highlightTimer = null;
  }
  highlightTimer = window.setTimeout(() => {
    pianoStore.clearHighlightKeys();
    highlightTimer = null;
  }, durationSec * 1000);
}

// 暴露方法到模板
// @ts-ignore
defineExpose({ play, stop, print, pause, resume });
</script>
