<template>
  <div
    class="px-4 py-2 mx-auto mt-5 text-center text-white transition-colors duration-300 rounded-lg max-w-[1200px]"
    :class="{ 'bg-blue-500': !isListening, 'bg-gray-800': isListening }"
  >
    <span>音频输入检测面板</span>
    <div class="mt-2 flex gap-2 justify-center">
      <template v-if="!isListening">
        <button
          class="px-4 py-1 rounded bg-white text-blue-600 font-bold hover:bg-blue-100"
          @click="toggleMic"
        >
          开始检测
        </button>
      </template>
      <template v-if="isListening && !isKaraoke">
        <button
          class="px-4 py-1 rounded bg-white text-blue-600 font-bold hover:bg-blue-100"
          @click="toggleMic"
        >
          停止检测
        </button>
      </template>
      <template v-if="!isKaraoke">
        <button
          class="px-4 py-1 rounded bg-white text-blue-600 font-bold hover:bg-blue-100"
          @click="toggleKaraoke"
        >
          开始K歌
        </button>
      </template>
      <template v-if="isKaraoke">
        <button
          class="px-4 py-1 rounded bg-white text-blue-600 font-bold hover:bg-blue-100"
          @click="toggleKaraoke"
        >
          停止K歌
        </button>
      </template>
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

const { player, playState, init, play, stop, reset } = usePlayer();
const { noteNameToFreq, freqToNoteName } = useTone();

/**
 * 是否正在监听麦克风
 */
const isListening = ref(false);
const isKaraoke = ref(false); // 新增K歌状态
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
const STABLE_THRESHOLD = 2; // 连续4帧一致才更新

const canvasRef = ref<HTMLCanvasElement | null>(null);
const pitchHistory = ref<Array<{ note: string | null; freq: number | null }>>([]);
const currentPoint = ref<{ note: string | null; freq: number }>({ note: null, freq: 0 });
const historyPoints = ref<Array<{ note: string | null; freq: number }>>([]);
const MAX_POINTS = 50;

// 修改乐谱相关状态的类型定义
const scorePoints = ref<Array<{ note: string; freq: number; time: number; nodeTime: number }>>([]);
let unsubscribePointerMove: (() => void) | null = null;

// 添加记录实际播放时间的状态
const lastFrameTime = ref(0);
const smoothPlayingTime = ref(0);

let karaokeRafId: number | null = null;
let karaokeStartScoreTime = 0;
let karaokeStartRealTime = 0;
let karaokeEndUnsubscribe: (() => void) | null = null;

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
  if (isKaraoke.value) {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
    ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
    ctx.lineWidth = 2;
    const VISIBLE_DURATION = 5000; // 显示未来5秒的乐谱
    const NOTE_HEIGHT = 20; // 音高容差范围，单位为Hz
    scorePoints.value.forEach((point) => {
      // 直接使用音符时间计算位置，不需要转换
      const timeOffset = point.time - smoothPlayingTime.value;
      const duration = point.nodeTime * (60000 / (Number(SNRuntime.info.tempo) || 60));

      // 在画布宽度范围内映射时间偏移
      const visibleDuration = VISIBLE_DURATION;
      let startX =
        centerX + (timeOffset / (visibleDuration / 2)) * (width - LEFT_PADDING - centerX);
      let endX = startX + (duration / (visibleDuration / 2)) * (width - LEFT_PADDING - centerX);

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
      ctx.moveTo(startX, topY);
      ctx.lineTo(endX, topY);
      ctx.moveTo(startX, bottomY);
      ctx.lineTo(endX, bottomY);
      ctx.moveTo(startX, topY);
      ctx.lineTo(startX, bottomY);
      ctx.moveTo(endX, topY);
      ctx.lineTo(endX, bottomY);
      ctx.stroke();
    });
  }
}

/**
 * 开始/停止麦克风检测
 */
async function toggleMic() {
  if (isListening.value && !isKaraoke.value) {
    stopListening();
    stop();
  } else if (!isListening.value && !isKaraoke.value) {
    await startListening();
  }
}

async function toggleKaraoke() {
  if (isKaraoke.value) {
    // 停止K歌=停止检测+K歌
    stopKaraoke();
  } else {
    await startKaraoke();
  }
}

async function startKaraoke() {
  // 先清理上一次的动画帧和事件监听
  if (karaokeRafId) {
    cancelAnimationFrame(karaokeRafId);
    karaokeRafId = null;
  }
  karaokeEndUnsubscribe?.();
  karaokeEndUnsubscribe = null;

  isKaraoke.value = true;
  if (!isListening.value) {
    await startListening();
  }
  // 强制从头开始
  if (player.value) {
    reset();
    await play();
  }
  await initScoreData();
  // 初始化平滑时间
  karaokeStartScoreTime = 0;
  karaokeStartRealTime = performance.now();
  smoothPlayingTime.value = 0;
  karaokeRafId = requestAnimationFrame(animateKaraoke);
  karaokeEndUnsubscribe =
    player.value?.onEnd(() => {
      stopKaraoke();
    }) || null;
}

function stopKaraoke() {
  isKaraoke.value = false;
  if (karaokeRafId) {
    cancelAnimationFrame(karaokeRafId);
    karaokeRafId = null;
  }
  karaokeEndUnsubscribe?.();
  karaokeEndUnsubscribe = null;
  stop(); // 停止player播放
  isListening.value = false; // 切换面板回到检测/未检测状态
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
      return note.note;
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
    player.value?.onPointerMove((note: SNNoteOptions, time: number) => {
      // 只在时间跳变（如seek/跳音/暂停恢复）时更新基准点
      karaokeStartScoreTime = time;
      karaokeStartRealTime = performance.now();
    }) || null;
}

function animateKaraoke() {
  if (!isKaraoke.value) return;
  // 只有在播放时推进
  if (playState.value === 'playing') {
    smoothPlayingTime.value = karaokeStartScoreTime + (performance.now() - karaokeStartRealTime);
  }
  drawPitchHistory();
  karaokeRafId = requestAnimationFrame(animateKaraoke);
}

/**
 * 开始监听麦克风
 */
async function startListening() {
  try {
    smoothPlayingTime.value = 0;
    lastFrameTime.value = performance.now();
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
  isKaraoke.value = false; // 停止检测时也重置K歌状态
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
  if (karaokeRafId) {
    cancelAnimationFrame(karaokeRafId);
    karaokeRafId = null;
  }
}

/**
 * 实时检测音高
 */
function detect() {
  if (!analyser || !detector) return;

  // 更新平滑时间
  updateSmoothPlayingTime();

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

// 修改时间相关的状态和函数
function updateSmoothPlayingTime() {
  if (isListening.value && playState.value === 'playing') {
    const now = performance.now();
    const deltaTime = now - lastFrameTime.value;
    lastFrameTime.value = now;

    // 计算基于音符时间的实际速度（毫秒/毫秒）
    const baseDuration = 60000 / (Number(SNRuntime.info.tempo) || 60); // 一拍的毫秒数
    const timeScale = deltaTime / baseDuration; // 实际时间到音符时间的转换比例

    // 根据音符的实际时间坐标系更新平滑时间
    smoothPlayingTime.value += deltaTime;
  }
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
