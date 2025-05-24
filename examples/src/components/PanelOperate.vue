<template>
  <div class="operate-panel">
    <div class="btn-group">
      <button @click="print">🖨️打印</button>
      <button v-if="playState === 'idle'" @click="play">▶️播放</button>
      <button v-if="playState === 'playing'" @click="pause">⏸️暂停</button>
      <button v-if="playState === 'paused'" @click="resume">▶️继续</button>
      <button
        v-if="playState === 'playing' || playState === 'paused'"
        @click="stop"
      >
        ⏹️停止
      </button>
      <button @click="emitExport">📤导出</button>
      <button @click="triggerImport">📥导入</button>
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
import * as Tone from 'tone';
import { SNPlayer, type SimpleNotation } from '../../../lib';
import { SNPointerLayer } from '@layers';
import { ref } from 'vue';
import { useTone } from '../use/useTone';
import { defineEmits } from 'vue';

const props = defineProps<{
  sn: SimpleNotation | null;
  name: string;
  tempo: string;
  panelPianoRef?: any;
}>();

let player: SNPlayer | null = null;
const playState = ref<'idle' | 'playing' | 'paused'>('idle');

const transport = Tone.getTransport();

/**
 * 简谱数字到音名的映射（C调）
 */
const scaleMap = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const baseOctave = 4; // 默认八度

const { playNote } = useTone();

const emits = defineEmits([
  'import-file', // 导入文件后触发，参数为 file, content
  'export-file', // 导出按钮点击时触发
]);

const fileInput = ref<HTMLInputElement | null>(null);

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
 * 播放乐谱，使用钢琴采样音色
 * @returns {Promise<void>}
 */
const play = async () => {
  playState.value = 'playing';
  // 根据传入的tempo参数设置播放速度
  Tone.Transport.bpm.value = Number(props.tempo);
  player = new SNPlayer();
  player.onNotePlay((note, durationSec) => {
    const num = parseInt(note.note.replaceAll(/[()（）]/g, ''), 10);
    let noteName = '';
    if (!isNaN(num) && num >= 1 && num <= 7) {
      noteName = scaleMap[num - 1];
      if (note.upDownCount > 0) noteName += '#'.repeat(note.upDownCount);
      const octave = baseOctave + note.octaveCount;
      noteName += octave;
    }
    // 3. 播放音符（只播放有效音符）
    currentMainKeyIndex = null;
    if (note.note === '0') {
      if (props.panelPianoRef && props.panelPianoRef.clearHighlight) {
        props.panelPianoRef.clearHighlight();
      }
    } else if (noteName) {
      playNote(noteName, durationSec);
      if (props.panelPianoRef && props.panelPianoRef.highlightKeys) {
        const key = props.panelPianoRef.keys.find(
          (k: any) => k.note === noteName,
        );
        if (key) {
          currentMainKeyIndex = key.index;
        }
      }
    }
    // 合并高亮（只高亮本次主音和和弦）
    if (props.panelPianoRef && props.panelPianoRef.highlightKeys) {
      const merged = [
        ...(currentMainKeyIndex ? [currentMainKeyIndex] : []),
        ...currentChordKeyIndexes,
      ];
      if (merged.length > 0) {
        highlightWithTimeout(Array.from(new Set(merged)), durationSec);
      } else {
        if (props.panelPianoRef && props.panelPianoRef.clearHighlight) {
          props.panelPianoRef.clearHighlight();
        }
      }
    }
  });
  player.onChordPlay((note, durationSec) => {
    currentChordKeyIndexes = [];
    if (note.chord && chordMap[note.chord]) {
      const chordNotes = chordMap[note.chord];
      chordNotes.forEach((chordNote) => {
        playNote(chordNote, durationSec * 0.95);
      });
      if (props.panelPianoRef && props.panelPianoRef.highlightKeys) {
        currentChordKeyIndexes = chordNotes
          .map((chordNote) => {
            const key = props.panelPianoRef.keys.find(
              (k: any) => k.note === chordNote,
            );
            return key ? key.index : null;
          })
          .filter((idx) => idx !== null) as number[];
        // 合并主音高亮（只高亮本次主音和和弦）
        const merged = [
          ...(currentMainKeyIndex ? [currentMainKeyIndex] : []),
          ...currentChordKeyIndexes,
        ];
        if (merged.length > 0) {
          highlightWithTimeout(Array.from(new Set(merged)), durationSec);
        } else {
          if (props.panelPianoRef && props.panelPianoRef.clearHighlight) {
            props.panelPianoRef.clearHighlight();
          }
        }
      }
    } else {
      // 没有和弦时也要刷新高亮
      if (props.panelPianoRef && props.panelPianoRef.highlightKeys) {
        const merged = [...(currentMainKeyIndex ? [currentMainKeyIndex] : [])];
        if (merged.length > 0) {
          highlightWithTimeout(Array.from(new Set(merged)), durationSec);
        } else {
          if (props.panelPianoRef && props.panelPianoRef.clearHighlight) {
            props.panelPianoRef.clearHighlight();
          }
        }
      }
    }
  });
  player.onPointerMove((note) => {
    if (props.sn && props.sn.el) {
      SNPointerLayer.showPointer(`note-${note.index}`, props.sn.el);
    }
  });
  player.onEnd(() => {
    if (highlightTimer) {
      clearTimeout(highlightTimer);
      highlightTimer = null;
    }
    if (props.panelPianoRef && props.panelPianoRef.clearHighlight) {
      props.panelPianoRef.clearHighlight();
    }
    currentMainKeyIndex = null;
    currentChordKeyIndexes = [];
    transport.stop();
    transport.position = 0;
    SNPointerLayer.clearPointer();
    playState.value = 'idle';
  });
  player.play();
  await Tone.start();
  transport.start();
};

/**
 * 暂停播放
 * @returns {void}
 */
const pause = () => {
  playState.value = 'paused';
  if (player) {
    player.pause();
  }
  transport.pause();
  // 暂停时不清除高亮，保持当前按键
};

/**
 * 停止播放并重置进度
 * @returns {void}
 */
const stop = () => {
  playState.value = 'idle';
  if (player) {
    player.stop();
  }
  transport.stop();
  transport.position = 0;
  SNPointerLayer.clearPointer();
  if (highlightTimer) {
    clearTimeout(highlightTimer);
    highlightTimer = null;
  }
  if (props.panelPianoRef && props.panelPianoRef.clearHighlight) {
    props.panelPianoRef.clearHighlight();
  }
  currentMainKeyIndex = null;
  currentChordKeyIndexes = [];
};

const resume = () => {
  playState.value = 'playing';
  if (player) {
    player.resume();
  }
  transport.start();
  // 继续时不清除高亮
};

const print = () => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  const iframeWindow = iframe.contentWindow;
  if (iframeWindow) {
    const container = document.getElementById('container');
    if (container) {
      // 注入 Bravura 字体 @font-face
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
      `;
      iframeWindow.document.head.appendChild(style);

      iframeWindow.document.body.innerHTML = container.innerHTML;
      iframeWindow.document.title = `[SimpleNotation]${props.name || '未命名曲谱'}`;
      iframeWindow.document.body.style.margin = '0';
      iframeWindow.document.body.style.padding = '0';
      iframeWindow.document.body.style.backgroundColor = '#fff';
      // 延迟打印，确保字体加载
      setTimeout(() => {
        iframeWindow.focus();
        iframeWindow.print();
        document.body.removeChild(iframe);
      }, 800);
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
  if (props.panelPianoRef && props.panelPianoRef.highlightKeys) {
    props.panelPianoRef.highlightKeys(keys);
    if (highlightTimer) {
      clearTimeout(highlightTimer);
      highlightTimer = null;
    }
    highlightTimer = window.setTimeout(() => {
      if (props.panelPianoRef && props.panelPianoRef.clearHighlight) {
        props.panelPianoRef.clearHighlight();
      }
      highlightTimer = null;
    }, durationSec * 1000);
  }
}

// 暴露方法到模板
// @ts-ignore
defineExpose({ play, stop, print, pause, resume });
</script>

<style scoped>
.btn-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.operate-panel button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  min-height: auto;
  box-sizing: border-box;
  width: 80px;
}

.operate-panel button:focus {
  outline: none;
  border-color: #ff6b3d;
  box-shadow: 0 0 0 2px rgba(255, 107, 61, 0.1);
}

.operate-panel button:hover {
  background: rgba(255, 255, 255, 0.9);
}
</style>
