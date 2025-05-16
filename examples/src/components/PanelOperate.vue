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
import type { SNNoteOptions } from '../../../lib/src/types/options';
import type { SimpleNotation } from '../../../lib';

const props = defineProps<{ sn: SimpleNotation | null; name: string }>();

let synth: Tone.PolySynth | null = null;
let part: Tone.Part | null = null;

const transport = Tone.getTransport();

/**
 * 简谱数字到音名的映射（C调）
 */
const scaleMap = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const baseOctave = 4; // 默认八度

/**
 * 将解析后的乐谱结构转换为Tone.js可用的notes数组
 * @param {import('../../../lib/src/types/options').SNStaveOptions[]} parsedScore
 * @returns {Array<{time: number, note: string, duration: string}>}
 */
function getNotesFromParsedScore(
  parsedScore: unknown[],
): Array<{ time: number; note: string; duration: string }> {
  const notes: Array<{ time: number; note: string; duration: string }> = [];
  let currentTime = 0;
  if (!parsedScore) return notes;
  parsedScore.forEach((stave) => {
    const staveObj = stave as { measureOptions: any[] };
    staveObj.measureOptions.forEach((measure) => {
      const measureObj = measure as { noteOptions: SNNoteOptions[] };
      measureObj.noteOptions.forEach((noteOpt: SNNoteOptions) => {
        // 跳过休止符
        if (noteOpt.note === '-' || noteOpt.note === '0') {
          currentTime += getNoteDurationSeconds(noteOpt);
          return;
        }
        // 只处理1-7
        const num = parseInt(noteOpt.note, 10);
        if (isNaN(num) || num < 1 || num > 7) {
          currentTime += getNoteDurationSeconds(noteOpt);
          return;
        }
        let noteName = scaleMap[num - 1];
        // 处理升降号
        if (noteOpt.upDownCount > 0)
          noteName += '#'.repeat(noteOpt.upDownCount);
        if (noteOpt.upDownCount < 0)
          noteName += 'b'.repeat(-noteOpt.upDownCount);
        // 处理八度
        const octave = baseOctave + noteOpt.octaveCount;
        noteName += octave;
        // 处理时值
        const duration = getNoteDurationStr(noteOpt);
        notes.push({
          time: currentTime,
          note: noteName,
          duration,
        });
        currentTime += getNoteDurationSeconds(noteOpt);
      });
    });
  });
  return notes;
}

/**
 * 根据noteOptions计算Tone.js duration字符串
 * @param {SNNoteOptions} noteOpt
 * @returns {string}
 */
function getNoteDurationStr(noteOpt: SNNoteOptions): string {
  if (noteOpt.noteData.includes('/8')) return '8n';
  if (noteOpt.noteData.includes('/16')) return '16n';
  if (noteOpt.noteData.includes('/2')) return '2n';
  if (noteOpt.noteData.includes('/32')) return '32n';
  return '4n';
}

/**
 * 根据noteOptions估算时值（秒），用于累加time
 * @param {SNNoteOptions} noteOpt
 * @returns {number}
 */
function getNoteDurationSeconds(noteOpt: SNNoteOptions): number {
  // 以120bpm为基准，1拍=0.5s
  const bpm = 120;
  const beatDuration = 60 / bpm; // 一拍时长
  if (noteOpt.noteData.includes('/2')) return beatDuration * 2;
  if (noteOpt.noteData.includes('/8')) return beatDuration / 2;
  if (noteOpt.noteData.includes('/16')) return beatDuration / 4;
  if (noteOpt.noteData.includes('/32')) return beatDuration / 8;
  return beatDuration; // 默认4分音符
}

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
  const parsedScore = props.sn?.getParsedScore() ?? [];
  const notes = getNotesFromParsedScore(parsedScore);
  part = new Tone.Part((time, value) => {
    synth!.triggerAttackRelease(value.note, value.duration, time);
  }, notes).start(0);
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
