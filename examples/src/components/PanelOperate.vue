<template>
  <div class="operate-panel">
    <div class="btn-group">
      <button @click="print">打印</button>
      <button v-if="playState === 'idle'" @click="play">播放</button>
      <button v-if="playState === 'playing'" @click="pause">暂停</button>
      <button v-if="playState === 'paused'" @click="resume">继续</button>
      <button
        v-if="playState === 'playing' || playState === 'paused'"
        @click="stop"
      >
        停止
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

const props = defineProps<{
  sn: SimpleNotation | null;
  name: string;
  tempo: string;
}>();

let sampler: Tone.Sampler | null = null;
let player: SNPlayer | null = null;
const playState = ref<'idle' | 'playing' | 'paused'>('idle');

const transport = Tone.getTransport();

/**
 * 简谱数字到音名的映射（C调）
 */
const scaleMap = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const baseOctave = 4; // 默认八度

/**
 * 钢琴采样音源映射（常用音高）
 */
const pianoSamples = {
  A0: 'A0.mp3',
  C1: 'C1.mp3',
  'D#1': 'Ds1.mp3',
  'F#1': 'Fs1.mp3',
  A1: 'A1.mp3',
  C2: 'C2.mp3',
  'D#2': 'Ds2.mp3',
  'F#2': 'Fs2.mp3',
  A2: 'A2.mp3',
  C3: 'C3.mp3',
  'D#3': 'Ds3.mp3',
  'F#3': 'Fs3.mp3',
  A3: 'A3.mp3',
  C4: 'C4.mp3',
  'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3',
  A4: 'A4.mp3',
  C5: 'C5.mp3',
  'D#5': 'Ds5.mp3',
  'F#5': 'Fs5.mp3',
  A5: 'A5.mp3',
  C6: 'C6.mp3',
  'D#6': 'Ds6.mp3',
  'F#6': 'Fs6.mp3',
  A6: 'A6.mp3',
  C7: 'C7.mp3',
  'D#7': 'Ds7.mp3',
  'F#7': 'Fs7.mp3',
  A7: 'A7.mp3',
  C8: 'C8.mp3',
};

const pianoBaseUrl = '/piano/';

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

/**
 * 播放乐谱，使用钢琴采样音色
 * @returns {Promise<void>}
 */
const play = async () => {
  playState.value = 'playing';
  if (!sampler) {
    // 等待采样音频加载完成，避免 buffer not loaded 报错
    await new Promise<void>((resolve) => {
      sampler = new Tone.Sampler({
        urls: pianoSamples,
        baseUrl: pianoBaseUrl,
        onload: () => {
          console.log('Piano samples loaded');
          resolve();
        },
      }).toDestination();
    });
  }
  // 根据传入的tempo参数设置播放速度
  Tone.Transport.bpm.value = Number(props.tempo);
  player = new SNPlayer();
  player.onNotePlay((note) => {
    // 1. 计算音名
    const num = parseInt(note.note, 10);
    let noteName = '';
    if (!isNaN(num) && num >= 1 && num <= 7) {
      noteName = scaleMap[num - 1];
      if (note.upDownCount > 0) noteName += '#'.repeat(note.upDownCount);
      if (note.upDownCount < 0) noteName += 'b'.repeat(-note.upDownCount);
      const octave = baseOctave + note.octaveCount;
      noteName += octave;
    }
    // 2. 计算时值
    const duration = getNoteDurationStr(note);
    // 3. 让播放更自然：加上release
    const releaseSec = 0.35;
    const durationSec = Tone.Time(duration).toSeconds() + releaseSec;
    // 4. 播放音符（只播放有效音符）
    if (noteName) {
      sampler!.triggerAttackRelease(noteName, durationSec);
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
};

const resume = () => {
  playState.value = 'playing';
  if (player) {
    player.resume();
  }
  transport.start();
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
