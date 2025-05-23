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
    </div>
  </div>
</template>

<script setup lang="ts">
import * as Tone from 'tone';
import type { SNNoteOptions } from '../../../lib/src/types/options';
import { SNPlayer, type SimpleNotation } from '../../../lib';
import { SNPointerLayer } from '@layers';
import { ref } from 'vue';
import { useTone } from '../use/useTone';

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

/**
 * 根据noteOptions计算Tone.js duration字符串，支持附点音符
 * @param {SNNoteOptions} noteOpt
 * @returns {string}
 */
function getNoteDurationStr(noteOpt: SNNoteOptions): string {
  let base = '4n';
  if (noteOpt.noteData.includes('/8')) base = '8n';
  if (noteOpt.noteData.includes('/16')) base = '16n';
  if (noteOpt.noteData.includes('/2')) base = '2n';
  if (noteOpt.noteData.includes('/32')) base = '32n';
  // 判断是否带点（附点音符）
  if (noteOpt.noteData.includes('.')) base += '.';
  return base;
}

const { playNote } = useTone();

/**
 * 播放乐谱，使用钢琴采样音色
 * @returns {Promise<void>}
 */
const play = async () => {
  playState.value = 'playing';
  // 根据传入的tempo参数设置播放速度
  Tone.Transport.bpm.value = Number(props.tempo);
  player = new SNPlayer();
  player.onNotePlay((note) => {
    // 1. 计算音名
    const num = parseInt(note.note, 10);
    let noteName = '';
    if (!isNaN(num) && num >= 1 && num <= 7) {
      noteName = scaleMap[num - 1];
      // 只支持升号
      if (note.upDownCount > 0) noteName += '#'.repeat(note.upDownCount);
      const octave = baseOctave + note.octaveCount;
      noteName += octave;
    }
    // 2. 计算时值
    const duration = getNoteDurationStr(note);
    // 3. 让播放更自然：加上release
    const releaseSec = 0.35;
    const durationSec = Tone.Time(duration).toSeconds() + releaseSec;
    // 4. 播放音符（只播放有效音符）
    if (note.note === '0') {
      // 休止符不高亮任何键
      if (props.panelPianoRef && props.panelPianoRef.clearHighlight) {
        props.panelPianoRef.clearHighlight();
      }
      return;
    }
    if (noteName) {
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
      iframeWindow.document.body.innerHTML = container.innerHTML;
      iframeWindow.document.title = `[SimpleNotation]${props.name || '未命名曲谱'}`;
      iframeWindow.document.body.style.margin = '0';
      iframeWindow.document.body.style.padding = '0';
      iframeWindow.document.body.style.backgroundColor = '#fff';
      iframeWindow.focus();
      iframeWindow.print();
      document.body.removeChild(iframe);
    }
  }
};

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
