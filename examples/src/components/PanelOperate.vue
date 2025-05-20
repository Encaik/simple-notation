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
import type {
  SNMeasureOptions,
  SNNoteOptions,
  SNStaveOptions,
} from '../../../lib/src/types/options';
import type { SimpleNotation } from '../../../lib';
import { SNPointerLayer } from '@layers';

const props = defineProps<{
  sn: SimpleNotation | null;
  name: string;
  tempo: string;
}>();

let sampler: Tone.Sampler | null = null;
let part: Tone.Part | null = null;

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
 * 将解析后的乐谱结构转换为Tone.js可用的notes数组
 * 支持延音线（'-'），其时值会累加到前一个音符上
 * 支持连音线（tie）：如果isTieStart和isTieEnd只包围两个音且音高完全相同，则合并为一个音符，时值相加
 * @param {SNStaveOptions[]} parsedScore
 * @returns {Array<{time: number, note: string, duration: string}>}
 */
function getNotesFromParsedScore(
  parsedScore: SNStaveOptions[],
): Array<{ time: number; note: string; duration: string; snTag: string }> {
  const notes: Array<{
    time: number;
    note: string;
    duration: string;
    snTag: string;
  }> = [];
  let currentTime = 0;
  let noteGlobalIndex = 1;
  if (!parsedScore) return notes;
  const tempo = Number(props.tempo);
  parsedScore.forEach((stave: SNStaveOptions) => {
    const staveObj = stave;
    staveObj.measureOptions.forEach((measure: SNMeasureOptions) => {
      const measureObj = measure;
      let lastNoteIdx = -1; // 记录上一个有效音符在notes数组中的下标
      const noteOptions = measureObj.noteOptions;
      for (let i = 0; i < noteOptions.length; i++) {
        const noteOpt = noteOptions[i];
        // 休止符单独处理
        if (noteOpt.note === '0') {
          noteGlobalIndex++;
          currentTime += getNoteDurationSeconds(noteOpt, tempo);
          continue;
        }
        // 延音线：将时值加到前一个音符
        if (noteOpt.note === '-') {
          noteGlobalIndex++;
          if (lastNoteIdx >= 0) {
            const addSec = getNoteDurationSeconds(noteOpt, tempo);
            const prev = notes[lastNoteIdx];
            let prevSec = Tone.Time(prev.duration).toSeconds();
            prevSec += addSec;
            prev.duration = `${prevSec}s`;
          }
          currentTime += getNoteDurationSeconds(noteOpt, tempo);
          continue;
        }
        // 连音线合并逻辑
        if (noteOpt.isTieStart) {
          // 查找下一个isTieEnd
          let tieEndIdx = -1;
          for (let j = i + 1; j < noteOptions.length; j++) {
            if (noteOptions[j].isTieEnd) {
              tieEndIdx = j;
              break;
            }
          }
          // 只处理两个音且音高完全相同的情况
          if (
            tieEndIdx === i + 1 &&
            isNotePitchEqual(noteOpt, noteOptions[tieEndIdx])
          ) {
            // 合并时值
            const durationSec =
              getNoteDurationSeconds(noteOpt, tempo) +
              getNoteDurationSeconds(noteOptions[tieEndIdx], tempo);
            let noteName = getNoteName(noteOpt);
            notes.push({
              time: currentTime,
              note: noteName,
              duration: `${durationSec}s`,
              snTag: `note-${noteGlobalIndex++}`,
            });
            lastNoteIdx = notes.length - 1;
            currentTime += durationSec;
            i = tieEndIdx; // 跳过下一个音
            continue;
          }
        }
        // 只处理1-7
        const num = parseInt(noteOpt.note, 10);
        if (isNaN(num) || num < 1 || num > 7) {
          currentTime += getNoteDurationSeconds(noteOpt, tempo);
          continue;
        }
        let noteName = getNoteName(noteOpt);
        const duration = getNoteDurationStr(noteOpt);
        notes.push({
          time: currentTime,
          note: noteName,
          duration,
          snTag: `note-${noteGlobalIndex++}`,
        });
        lastNoteIdx = notes.length - 1;
        currentTime += getNoteDurationSeconds(noteOpt, tempo);
      }
    });
  });
  return notes;
}

/**
 * 判断两个音高是否完全一致（note、upDownCount、octaveCount）
 * @param {SNNoteOptions} a
 * @param {SNNoteOptions} b
 * @returns {boolean}
 */
function isNotePitchEqual(a: SNNoteOptions, b: SNNoteOptions): boolean {
  return (
    a.note === b.note &&
    a.upDownCount === b.upDownCount &&
    a.octaveCount === b.octaveCount
  );
}

/**
 * 获取音名字符串（含升降号、八度）
 * @param {SNNoteOptions} noteOpt
 * @returns {string}
 */
function getNoteName(noteOpt: SNNoteOptions): string {
  const num = parseInt(noteOpt.note, 10);
  let noteName = scaleMap[num - 1];
  if (noteOpt.upDownCount > 0) noteName += '#'.repeat(noteOpt.upDownCount);
  if (noteOpt.upDownCount < 0) noteName += 'b'.repeat(-noteOpt.upDownCount);
  const octave = baseOctave + noteOpt.octaveCount;
  noteName += octave;
  return noteName;
}

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
 * 根据noteOptions估算时值（秒），用于累加time，支持附点音符
 * @param {SNNoteOptions} noteOpt
 * @param {number} tempo 实际播放速度bpm
 * @returns {number}
 */
function getNoteDurationSeconds(noteOpt: SNNoteOptions, tempo: number): number {
  const beatDuration = 60 / tempo; // 一拍时长
  let duration = beatDuration; // 默认4分音符
  if (noteOpt.noteData.includes('/2')) duration = beatDuration * 2;
  if (noteOpt.noteData.includes('/8')) duration = beatDuration / 2;
  if (noteOpt.noteData.includes('/16')) duration = beatDuration / 4;
  if (noteOpt.noteData.includes('/32')) duration = beatDuration / 8;
  // 判断是否带点（附点音符）
  if (noteOpt.noteData.includes('.')) duration *= 1.5;
  return duration;
}

/**
 * 播放乐谱，使用钢琴采样音色
 * @returns {Promise<void>}
 */
const play = async () => {
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
  if (part) {
    part.dispose();
  }
  // 根据传入的tempo参数设置播放速度
  Tone.Transport.bpm.value = Number(props.tempo);
  const parsedScore = props.sn?.getParsedScore() ?? [];
  const notes = getNotesFromParsedScore(parsedScore);
  part = new Tone.Part((time, value) => {
    sampler!.triggerAttackRelease(value.note, value.duration, time);
    // 播放光标
    if (props.sn && props.sn.el && value.snTag) {
      SNPointerLayer.showPointer(value.snTag, props.sn.el);
    }
  }, notes).start(0);
  await Tone.start();
  transport.stop();
  transport.position = 0;
  SNPointerLayer.clearPointer();
  transport.start();
};

/**
 * 停止播放并重置进度
 * @returns {void}
 */
const stop = () => {
  transport.stop();
  transport.position = 0;
  SNPointerLayer.clearPointer();
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
