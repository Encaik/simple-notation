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
  // 字母和弦
  C: ['C4', 'E4', 'G4'],
  D: ['D4', 'F#4', 'A4'],
  E: ['E4', 'G#4', 'B4'],
  F: ['F4', 'A4', 'C5'],
  G: ['G4', 'B4', 'D5'],
  A: ['A4', 'C#5', 'E5'],
  B: ['B4', 'D#5', 'F#5'],
  // 小写和弦（小三和弦）
  Cm: ['C4', 'Eb4', 'G4'],
  Dm: ['D4', 'F4', 'A4'],
  Em: ['E4', 'G4', 'B4'],
  Fm: ['F4', 'Ab4', 'C5'],
  Gm: ['G4', 'Bb4', 'D5'],
  Am: ['A4', 'C5', 'E5'],
  Bm: ['B4', 'D5', 'F#5'],
  // 数字和弦（以C大调为例，1=C，2=Dm，3=Em，4=F，5=G，6=Am，7=Bm）
  '1': ['C4', 'E4', 'G4'],
  '2': ['D4', 'F4', 'A4'],
  '3': ['E4', 'G4', 'B4'],
  '4': ['F4', 'A4', 'C5'],
  '5': ['G4', 'B4', 'D5'],
  '6': ['A4', 'C5', 'E5'],
  '7': ['B4', 'D5', 'F#5'],
};

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
    // 1. 计算音名
    const num = parseInt(note.note.replaceAll(/[()（）]/g, ''), 10);
    let noteName = '';
    if (!isNaN(num) && num >= 1 && num <= 7) {
      noteName = scaleMap[num - 1];
      // 只支持升号
      if (note.upDownCount > 0) noteName += '#'.repeat(note.upDownCount);
      const octave = baseOctave + note.octaveCount;
      noteName += octave;
    }
    // 2. 让播放更自然：加上release
    // const releaseSec = 0.8; // 已不再使用
    // durationSec参数已由player传入，优先用
    // 3. 播放音符（只播放有效音符）
    if (note.note === '0') {
      // 休止符不高亮任何键
      if (props.panelPianoRef && props.panelPianoRef.clearHighlight) {
        props.panelPianoRef.clearHighlight();
      }
    } else if (noteName) {
      playNote(noteName, durationSec);
      // 高亮钢琴键
      if (props.panelPianoRef && props.panelPianoRef.highlightKeys) {
        // 找到88键中对应的key index
        const key = props.panelPianoRef.keys.find(
          (k: any) => k.note === noteName,
        );
        if (key) {
          props.panelPianoRef.highlightKeys([key.index]);
        }
      }
    }
  });
  // 新增：和弦播放逻辑，所有有chord的音符都能播放和弦
  player.onChordPlay((note, durationSec) => {
    if (note.chord && chordMap[note.chord]) {
      chordMap[note.chord].forEach((chordNote) => {
        playNote(chordNote, durationSec * 0.95);
      });
    }
  });
  player.onPointerMove((note) => {
    if (props.sn && props.sn.el) {
      SNPointerLayer.showPointer(`note-${note.index}`, props.sn.el);
    }
  });
  player.onEnd(() => {
    transport.stop();
    transport.position = 0;
    SNPointerLayer.clearPointer();
    playState.value = 'idle';
    // 清除钢琴高亮
    if (props.panelPianoRef && props.panelPianoRef.clearHighlight) {
      props.panelPianoRef.clearHighlight();
    }
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
  // 清除钢琴高亮
  if (props.panelPianoRef && props.panelPianoRef.clearHighlight) {
    props.panelPianoRef.clearHighlight();
  }
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
