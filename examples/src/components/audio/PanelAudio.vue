<template>
  <div
    class="px-4 py-2 mx-auto mt-5 text-center text-white transition-colors duration-300 rounded-lg max-w-[1200px] bg-blue-500"
  >
    <span>音频输入检测面板</span>
    <div class="mt-2">
      <button
        class="px-4 py-1 rounded bg-white text-blue-600 font-bold hover:bg-blue-100"
        @click="toggleMic"
      >
        {{ isListening ? '停止检测' : '开始检测' }}
      </button>
    </div>
    <div class="mt-4 text-3xl font-bold min-h-[2em]">
      检测到的音高：
      <span v-if="detectedNote">{{ detectedNote }}</span>
      <span v-else>--</span>
    </div>
    <div class="mt-2 text-sm text-blue-100" v-if="detectedFreq">
      当前频率：{{ detectedFreq.toFixed(2) }} Hz
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PitchDetector } from 'pitchy';

/**
 * 是否正在监听麦克风
 */
const isListening = ref(false);
/**
 * 检测到的音高
 */
const detectedNote = ref<string | null>(null);
/**
 * 检测到的频率
 */
const detectedFreq = ref<number | null>(null);

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: MediaStreamAudioSourceNode | null = null;
let rafId: number | null = null;
let stream: MediaStream | null = null;
const bufferSize = 2048;
let detector: ReturnType<typeof PitchDetector.forFloat32Array> | null = null;
let buffer = new window.Float32Array(bufferSize);

/**
 * 开始/停止麦克风检测
 */
async function toggleMic() {
  if (isListening.value) {
    stopListening();
  } else {
    await startListening();
  }
}

/**
 * 开始监听麦克风
 */
async function startListening() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = bufferSize;
    source.connect(analyser);
    detector = PitchDetector.forFloat32Array(buffer.length);
    isListening.value = true;
    detect();
  } catch (err) {
    alert('无法访问麦克风: ' + err);
  }
}

/**
 * 停止监听麦克风
 */
function stopListening() {
  isListening.value = false;
  detectedNote.value = null;
  detectedFreq.value = null;
  if (rafId) cancelAnimationFrame(rafId);
  if (analyser) analyser.disconnect();
  if (source) source.disconnect();
  if (audioContext) audioContext.close();
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  audioContext = null;
  analyser = null;
  source = null;
  stream = null;
}

/**
 * 实时检测音高
 */
function detect() {
  if (!analyser || !detector) return;
  analyser.getFloatTimeDomainData(buffer);
  const [pitch, clarity] = detector.findPitch(buffer, audioContext!.sampleRate);
  if (clarity > 0.95 && pitch > 60 && pitch < 1500) {
    detectedFreq.value = pitch;
    detectedNote.value = freqToNoteName(pitch);
  } else {
    detectedFreq.value = null;
    detectedNote.value = null;
  }
  if (isListening.value) {
    rafId = requestAnimationFrame(detect);
  }
}

/**
 * 频率转音名+八度（如C4、D#4、A5）
 * @param {number} freq
 * @returns {string}
 */
function freqToNoteName(freq: number): string {
  // 以A4=440Hz为基准
  const noteNames = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ];
  const A4 = 440;
  const n = Math.round(12 * Math.log2(freq / A4));
  const noteIndex = (n + 9 + 12 * 1000) % 12; // +9是因为A是第9个
  const octave = 4 + Math.floor((n + 9) / 12);
  return noteNames[noteIndex] + octave;
}
</script>
