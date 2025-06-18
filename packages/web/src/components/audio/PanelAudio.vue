<template>
  <div
    class="px-4 py-2 mx-auto mt-5 text-center text-white transition-colors duration-300 rounded-lg max-w-[1200px]"
    :class="{ 'bg-blue-500': !isListening, 'bg-gray-800': isListening }"
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
    <canvas v-show="isListening" ref="canvasRef" class="w-full h-[200px] mt-4"></canvas>
    <div class="mt-4 text-xl font-bold min-h-[2em] flex items-center justify-center gap-4">
      <div>
        检测到的音高：
        <span>{{ detectedNote || '--' }}</span>
      </div>
      <div>
        当前频率：
        <span>{{ detectedFreq?.toFixed(2) || '--' }} Hz</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { PitchDetector } from 'pitchy';
import { usePlayer, useTone } from '@/use';
import { SNRuntime, SNTransition } from 'simple-notation';
import type { SNNoteOptions } from 'simple-notation';

const { player, init, play, stop, reset } = usePlayer();
const { noteNameToFreq } = useTone();

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

// 添加最大频率的状态
const maxFreq = ref(500); // 默认500Hz

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: MediaStreamAudioSourceNode | null = null;
let rafId: number | null = null;
let stream: MediaStream | null = null;
const bufferSize = 2048;
let detector: ReturnType<typeof PitchDetector.forFloat32Array> | null = null;
let buffer = new window.Float32Array(bufferSize);

// 音高稳定性判断相关变量
let lastPitch: string | null = null;
let stableCount = 0;
const STABLE_THRESHOLD = 4; // 连续4帧一致才更新

const canvasRef = ref<HTMLCanvasElement | null>(null);
const pitchHistory = ref<Array<{ note: string | null; freq: number | null }>>([]);
const currentPoint = ref<{ note: string | null; freq: number }>({ note: null, freq: 0 });
const historyPoints = ref<Array<{ note: string | null; freq: number }>>([]);
const MAX_POINTS = 50;

// 修改乐谱相关状态的类型定义
const scorePoints = ref<Array<{ note: string; freq: number; time: number; nodeTime: number }>>([]);
let currentPlayingTime = 0;
let unsubscribePointerMove: (() => void) | null = null;

// 修改初始化canvas函数
function initCanvas() {
  if (!isListening.value) return; // 只在检测状态才初始化

  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
}

// 绘制音高历史
function drawPitchHistory() {
  if (!isListening.value) return;

  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  initCanvas();

  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  const LEFT_PADDING = 60;
  const BOTTOM_PADDING = 20; // 添加底部留白
  const chartHeight = height - BOTTOM_PADDING; // 实际图表高度

  // 清空画布并重置比例
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  // 设置刻度文字样式
  ctx.font = '10px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // 绘制网格背景和刻度
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 0.5;

  // 横向网格线和频率刻度
  const freqStep = 100; // 每100Hz一个刻度
  for (let freq = 0; freq <= maxFreq.value; freq += freqStep) {
    const y = chartHeight - (freq / maxFreq.value) * (chartHeight * 0.8);

    // 绘制刻度文字，调整间距
    ctx.fillText(`${freq}Hz`, LEFT_PADDING - 8, y);

    // 绘制网格线
    ctx.beginPath();
    ctx.moveTo(LEFT_PADDING, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 纵向网格线
  const xStep = (width - LEFT_PADDING) / 20;
  for (let i = 0; i <= 20; i++) {
    const x = LEFT_PADDING + i * xStep;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // 设置折线样式
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';

  // 绘制音高折线
  ctx.beginPath();
  const pointXStep = (width / 2 - LEFT_PADDING) / MAX_POINTS;
  const centerX = width / 2;

  // 从当前点开始画一条线到左边
  const currentY = chartHeight - (currentPoint.value.freq / maxFreq.value) * (chartHeight * 0.8);
  ctx.moveTo(centerX, currentY);

  // 绘制历史数据，直到左边界
  historyPoints.value.forEach((point, index) => {
    const x = centerX - (index + 1) * pointXStep;
    // 如果超出左边界则停止绘制
    if (x < LEFT_PADDING) return;

    const y = chartHeight - (point.freq / maxFreq.value) * (chartHeight * 0.8);
    ctx.lineTo(x, y);
  });

  ctx.stroke();

  // 绘制当前点
  ctx.beginPath();
  ctx.arc(centerX, currentY, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#4CAF50';
  ctx.fill();

  // 在绘制实时检测线之前，先绘制乐谱线
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
  ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
  ctx.lineWidth = 2;

  const VISIBLE_DURATION = 5000; // 显示未来5秒的乐谱
  const NOTE_HEIGHT = 20; // 音高容差范围，单位为Hz

  scorePoints.value.forEach((point) => {
    const timeOffset = point.time - currentPlayingTime;
    const duration = point.nodeTime * (60000 / (Number(SNRuntime.info.tempo) || 60));

    // 修改时间到空间的映射逻辑，正向映射使其从右往左移动
    let startX = centerX + (timeOffset / (VISIBLE_DURATION / 2)) * (width - LEFT_PADDING - centerX);
    let endX = startX + (duration / (VISIBLE_DURATION / 2)) * (width - LEFT_PADDING - centerX);

    // 如果音符完全超出可视区域，则跳过
    if (endX < LEFT_PADDING || startX > width) return;

    // 裁剪超出区域的部分
    startX = Math.max(startX, LEFT_PADDING);
    endX = Math.min(endX, width);

    // 计算音高区域的上下边界
    const centerY = chartHeight - (point.freq / maxFreq.value) * (chartHeight * 0.8);
    const topY = centerY - NOTE_HEIGHT / 2;
    const bottomY = centerY + NOTE_HEIGHT / 2;

    // 绘制音符区域（半透明矩形）
    ctx.beginPath();
    ctx.moveTo(startX, topY);
    ctx.lineTo(endX, topY);
    ctx.lineTo(endX, bottomY);
    ctx.lineTo(startX, bottomY);
    ctx.closePath();
    ctx.fill();

    // 绘制矩形边框（四边）
    ctx.beginPath();
    // 上边
    ctx.moveTo(startX, topY);
    ctx.lineTo(endX, topY);
    // 下边
    ctx.moveTo(startX, bottomY);
    ctx.lineTo(endX, bottomY);
    // 左边
    ctx.moveTo(startX, topY);
    ctx.lineTo(startX, bottomY);
    // 右边
    ctx.moveTo(endX, topY);
    ctx.lineTo(endX, bottomY);
    ctx.stroke();
  });
}

/**
 * 开始/停止麦克风检测
 */
async function toggleMic() {
  if (isListening.value) {
    stopListening();
    stop(); // 停止播放器
  } else {
    await startListening();
  }
}

/**
 * 初始化乐谱数据
 */
async function initScoreData() {
  // 确保 player 已初始化
  if (!player.value) {
    await init();
    await play();
  }

  // 重置最大频率
  maxFreq.value = 500; // 重置为默认值

  // 初始化乐谱数据
  const notes = player.value?.getNotes() || [];
  let currentTime = 0;

  // 修改数据转换逻辑
  scorePoints.value = notes
    .filter((note) => {
      return note.note && note.note !== '-' && !note.isTieEnd && !isNaN(parseInt(note.note));
    })
    .map((note) => {
      const noteNumber = SNTransition.General.simpleNoteToNoteName(
        note.note,
        note.octaveCount,
        note.upDownCount,
      );
      const freq = noteNameToFreq(noteNumber || '');
      // 更新最大频率
      if (freq > maxFreq.value) {
        maxFreq.value = Math.ceil(freq / 100) * 100;
      }

      const time = currentTime;
      const nodeTime = note.nodeTime || 1;
      currentTime += nodeTime * (60000 / (Number(SNRuntime.info.tempo) || 60));

      return {
        note: note.note,
        freq,
        time,
        nodeTime,
      };
    });

  // 最后再加上余量
  maxFreq.value += 100;

  // 订阅播放进度
  unsubscribePointerMove?.(); // 先清除可能存在的旧订阅
  unsubscribePointerMove =
    player.value?.onPointerMove((note: SNNoteOptions, currentTime: number) => {
      currentPlayingTime = currentTime;
      if (isListening.value) {
        drawPitchHistory();
      }
    }) || null;
}

/**
 * 开始监听麦克风
 */
async function startListening() {
  try {
    // 重置播放器状态
    if (player.value) {
      currentPlayingTime = 0;
      reset();
      await play();
    }
    await initScoreData();

    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = bufferSize;
    source.connect(analyser);
    detector = PitchDetector.forFloat32Array(buffer.length);

    // 先设置状态
    isListening.value = true;
    pitchHistory.value = [];

    requestAnimationFrame(() => {
      initCanvas();
      detect();
    });
  } catch (err) {
    console.error('Error in startListening:', err);
    alert('无法访问麦克风: ' + err);
  }
}

/**
 * 停止监听麦克风
 */
function stopListening() {
  currentPoint.value = { note: null, freq: 0 };
  historyPoints.value = [];
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
  unsubscribePointerMove?.();
  unsubscribePointerMove = null;
  // 不清空乐谱数据
}

/**
 * 实时检测音高
 */
function detect() {
  if (!analyser || !detector) return;
  analyser.getFloatTimeDomainData(buffer);
  const [pitch, clarity] = detector.findPitch(buffer, audioContext!.sampleRate);
  let currentNote: string | null = null;
  let currentFreq = 0; // 默认设置为0而不是null

  if (clarity > 0.95 && pitch > 60 && pitch < 1500) {
    currentFreq = pitch;
    detectedFreq.value = pitch;
    currentNote = freqToNoteName(pitch);
  } else {
    detectedFreq.value = null;
    currentNote = null;
  }

  // 更新当前点和历史
  currentPoint.value = { note: currentNote, freq: currentFreq };
  historyPoints.value.unshift({ note: currentNote, freq: currentFreq });
  if (historyPoints.value.length > MAX_POINTS) {
    historyPoints.value.pop();
  }

  // 绘制图表
  drawPitchHistory();

  // 稳定性判断：只有连续多帧音高一致才更新UI
  if (currentNote === lastPitch && currentNote !== null) {
    stableCount++;
    if (stableCount >= STABLE_THRESHOLD) {
      detectedNote.value = currentNote;
    }
  } else {
    stableCount = 1;
    lastPitch = currentNote;
    // 可以选择 detectedNote.value = null; 或保持原值
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
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const A4 = 440;
  const n = Math.round(12 * Math.log2(freq / A4));
  const noteIndex = (n + 9 + 12 * 1000) % 12; // +9是因为A是第9个
  const octave = 4 + Math.floor((n + 9) / 12);
  return noteNames[noteIndex] + octave;
}

// 修改乐谱频率的映射函数
function noteToFreq(note: string): number {
  // 对于简谱数字，直接转换
  const noteNumber = parseInt(note);
  if (!isNaN(noteNumber)) {
    const octave = 4; // 默认使用第4个八度
    return 440 * Math.pow(2, (noteNumber - 1) / 12);
  }

  // 如果不是数字，使用原来的逻辑
  const A4 = 440;
  const noteMap: Record<string, number> = {
    C: -9,
    D: -7,
    E: -5,
    F: -4,
    G: -2,
    A: 0,
    B: 2,
  };

  const offset = noteMap[note[0]] || 0;
  const octave = parseInt(note.slice(-1)) - 4;
  return A4 * Math.pow(2, (offset + octave * 12) / 12);
}

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener('resize', () => {
    if (isListening.value) {
      initCanvas();
    }
  });
});

// 移除 onMounted 中的乐谱数据初始化代码，只保留 resize 监听
onMounted(() => {
  window.addEventListener('resize', () => {
    if (isListening.value) {
      initCanvas();
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', initCanvas);
  unsubscribePointerMove?.();
});
</script>
