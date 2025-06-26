<template>
  <canvas ref="canvasRef" class="absolute top-0 left-0 w-full h-full z-0 opacity-70"></canvas>
</template>

<script setup lang="ts">
import { usePianoRollStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
});

const pianoRollStore = usePianoRollStore();
const { audioBufferForSpectrogram, mp3Offset, rowHeight } = storeToRefs(pianoRollStore);

const canvasRef = ref<HTMLCanvasElement | null>(null);

/**
 * 将 MIDI 音高编号转换为频率 (Hz)
 * @param midi - MIDI 编号 (21-108)
 * @returns 频率 (Hz)
 */
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

watch(
  [() => audioBufferForSpectrogram, () => mp3Offset],
  ([newAudioBuffer]) => {
    if (newAudioBuffer.value && canvasRef.value) {
      drawSpectrogram(newAudioBuffer.value, canvasRef.value);
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (audioBufferForSpectrogram.value && canvasRef.value) {
    drawSpectrogram(audioBufferForSpectrogram.value, canvasRef.value);
  }
});

/**
 * 绘制频谱图的核心函数
 * @param audioBuffer - 音频数据
 * @param canvas - 用于绘制的 Canvas 元素
 */
async function drawSpectrogram(audioBuffer: AudioBuffer, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false; // 禁用图像平滑，确保线条清晰

  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate,
  );
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  const analyser = offlineCtx.createAnalyser();
  analyser.fftSize = 2048; // 提高频谱分辨率
  const frequencyBinCount = analyser.frequencyBinCount; // 1024

  // 这个 bufferSize 决定了时间轴上的分辨率
  const bufferSize = 1024;
  const processor = offlineCtx.createScriptProcessor(bufferSize, 1, 1);

  source.connect(analyser);
  analyser.connect(processor);
  processor.connect(offlineCtx.destination);

  // 预先计算每个钢琴键的频率范围和对应的FFT bin范围
  const keyFrequencyInfo = Array.from({ length: 88 }, (_, i) => {
    const midi = 108 - i; // 从 C8 (索引0) 到 A0 (索引87)
    // 计算每个音符频率范围的上下限，中心是音符的标准频率
    const lowerBoundFreq = midiToFreq(midi - 0.5);
    const upperBoundFreq = midiToFreq(midi + 0.5);

    // 将频率范围转换为FFT数据中的索引范围
    const startBin = Math.max(
      0,
      Math.floor((lowerBoundFreq * analyser.fftSize) / offlineCtx.sampleRate),
    );
    const endBin = Math.min(
      frequencyBinCount - 1,
      Math.ceil((upperBoundFreq * analyser.fftSize) / offlineCtx.sampleRate),
    );
    return { startBin, endBin };
  });

  const spectrogramData: number[][] = []; // 存储每个时间点上每个琴键的能量

  processor.onaudioprocess = () => {
    const frequencyData = new Float32Array(frequencyBinCount);
    analyser.getFloatFrequencyData(frequencyData);

    const keyEnergies = new Array(88).fill(-Infinity);

    keyFrequencyInfo.forEach((keyInfo, keyIndex) => {
      let maxEnergy = -Infinity;
      for (let i = keyInfo.startBin; i <= keyInfo.endBin; i++) {
        if (frequencyData[i] > maxEnergy) {
          maxEnergy = frequencyData[i];
        }
      }
      keyEnergies[keyIndex] = maxEnergy;
    });

    spectrogramData.push(keyEnergies);
  };

  source.start(0);
  offlineCtx.startRendering();

  offlineCtx.oncomplete = () => {
    canvas.width = props.width;
    canvas.height = props.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const timeSlices = spectrogramData.length;
    if (timeSlices === 0) return;

    const colWidth = canvas.width / timeSlices;
    const minDecibels = -100;
    const maxDecibels = -20;
    const dbRange = maxDecibels - minDecibels;

    // 计算偏移对应的像素
    const totalDuration = audioBuffer.duration;
    const offsetPx = (mp3Offset.value / totalDuration) * canvas.width;

    // 一次性渲染所有数据，整体向左平移offsetPx
    for (let t = 0; t < timeSlices; t++) {
      const xStart = Math.floor(t * colWidth - offsetPx);
      const xEnd = Math.floor((t + 1) * colWidth - offsetPx);
      const rectWidth = xEnd - xStart;
      if (rectWidth <= 0 || xEnd < 0 || xStart > canvas.width) continue;
      for (let k = 0; k < 88; k++) {
        const energy = spectrogramData[t][k];
        if (energy === -Infinity) continue;
        const normalizedEnergy = (energy - minDecibels) / dbRange;
        if (normalizedEnergy <= 0) continue;
        const hue = 240 - normalizedEnergy * 240;
        const saturation = 90;
        const lightness = 50 + normalizedEnergy * 15;
        const alpha = Math.pow(normalizedEnergy, 1.5) * 0.7;
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        const yStart = Math.floor(k * rowHeight.value);
        const yEnd = Math.floor((k + 1) * rowHeight.value);
        const rectHeight = yEnd - yStart;
        if (rectHeight <= 0) continue;
        ctx.fillRect(xStart, yStart, rectWidth, rectHeight);
      }
    }
  };
}
</script>
