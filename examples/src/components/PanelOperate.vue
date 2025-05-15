<template>
  <div class="operate-panel">
    <div class="btn-group">
      <button @click="print">打印</button>
      <button @click="play">播放</button>
      <button @click="stop">停止</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as Tone from 'tone';

/**
 * mock音符数据，后续可替换为实际数据
 */
const mockNotes = [
  { time: 0, note: 'C4', duration: '4n' },
  { time: '0:1', note: 'E4', duration: '4n' },
  { time: '0:2', note: 'G4', duration: '4n' },
  { time: '0:3', note: 'C5', duration: '4n' },
];

let synth: Tone.PolySynth | null = null;
let part: Tone.Part | null = null;

const transport = Tone.getTransport();

/**
 * 播放mock音符数据
 * @returns {Promise<void>}
 */
const play = async () => {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
  }
  if (part) {
    part.dispose();
  }
  part = new Tone.Part(
    (time: number, value: { note: string; duration: string }) => {
      synth!.triggerAttackRelease(value.note, value.duration, time);
    },
    mockNotes,
  ).start(0);
  await Tone.start();
  transport.stop();
  transport.position = 0;
  transport.start();
};

/**
 * 停止播放并重置进度
 * @returns {void}
 */
const stop = () => {
  transport.stop();
  transport.position = 0;
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
      iframeWindow.focus();
      iframeWindow.print();
      document.body.removeChild(iframe);
    }
  }
};
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
