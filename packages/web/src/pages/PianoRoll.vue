<template>
  <Card>
    <template v-slot:title>
      <div class="flex justify-between items-center w-full">
        <span>编曲工具</span>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <label for="beatsPerBarInput" class="text-sm font-medium text-gray-300">拍/节:</label>
            <input
              id="beatsPerBarInput"
              v-model.number="beatsPerBar"
              type="number"
              min="1"
              max="16"
              class="w-16 bg-white bg-opacity-80 border border-gray-300 text-gray-900 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center gap-2">
            <label for="quantizationSelect" class="text-sm font-medium text-gray-300">量化:</label>
            <select
              id="quantizationSelect"
              v-model.number="quantization"
              class="bg-white bg-opacity-80 border border-gray-300 text-gray-900 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option v-for="opt in quantizationOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label for="tempoInput" class="text-sm font-medium text-gray-300">速度:</label>
            <input
              id="tempoInput"
              v-model.number="tempo"
              type="number"
              min="30"
              max="300"
              class="w-20 bg-white bg-opacity-80 border border-gray-300 text-gray-900 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <Button @click="togglePlayback">{{ isPlaying ? '停止' : '播放' }}</Button>
          <Button v-if="mode === 'bar' && type === 'edit'" @click="completeEditing"
            >完成编辑</Button
          >
          <Button v-if="!(mode === 'bar' && type === 'edit')" @click="onGenerateClick"
            >生成模板文本</Button
          >
          <Button v-if="!(mode === 'bar' && type === 'edit')" @click="createNewScoreFromArrangement"
            >以此新建乐谱</Button
          >
          <Button @click="goHome">返回首页</Button>
          <div class="flex items-center gap-2" v-if="mode === 'time'">
            <label for="mp3OffsetInput" class="text-sm font-medium text-gray-300"
              >音频/参考起始偏移(s):</label
            >
            <input
              id="mp3OffsetInput"
              v-model.number="mp3OffsetProxy"
              type="number"
              min="0"
              step="0.01"
              class="w-20 bg-white bg-opacity-80 border border-gray-300 text-gray-900 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <Button @click="openTapModal" v-if="mode === 'time'">Tap Tempo</Button>
        </div>
      </div>
    </template>
    <div class="h-[90vh] w-full flex bg-gray-700 rounded-md overflow-hidden relative">
      <Loading :is-loading="isLoading" text="正在分析和加载音符..." />
      <PianoKeyboard class="w-16 flex-shrink-0" />
      <div class="flex flex-col flex-1 w-0" ref="minimapContainer">
        <PianoTimeLine :mode="mode === 'bar' ? 'bar' : 'time'" />
        <Minimap />
        <PianoGrid
          ref="pianoGridRef"
          class="flex-1 overflow-auto"
          :key="pianoRollStore.mp3Offset"
          :audio-buffer="audioBuffer"
        />
      </div>
    </div>
  </Card>

  <Modal :is-open="isModalOpen" @update:is-open="isModalOpen = $event" title="生成的模板文本">
    <textarea
      v-model="generatedText"
      readonly
      class="w-full h-96 p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      placeholder="这里显示生成的文本..."
    ></textarea>
  </Modal>

  <Modal :is-open="isTapModalOpen" @update:is-open="closeTapModal" title="Tap Tempo节拍测算">
    <div class="flex flex-col items-center gap-4 p-4">
      <div class="flex gap-2">
        <Button @click="tapPlay" :disabled="tapIsPlaying">播放</Button>
        <Button @click="tapStop" :disabled="!tapIsPlaying">停止</Button>
      </div>
      <div class="text-lg font-bold">
        当前BPM: <span class="text-blue-600">{{ tapTempo || '--' }}</span>
      </div>
      <Button class="w-48 h-24 text-2xl" @click="onTap">点击节拍 (Tap)</Button>
      <Button type="default" @click="applyTapTempo" :disabled="!tapTempo">应用到当前速度</Button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Button from '../widgets/Button.vue';
import PianoKeyboard from '../components/piano-roll/PianoKeyboard.vue';
import PianoGrid from '../components/piano-roll/PianoGrid.vue';
import PianoTimeLine from '../components/piano-roll/PianoTimeLine.vue';
import { ref, onMounted, watch, computed, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { SNTransition, type SNTemplate } from 'simple-notation';
import * as Tone from 'tone';
import { useTone } from '@/use';
import { useEditorStore, usePianoRollStore, type PianoRollNote } from '@/stores';
import Minimap from '../components/piano-roll/Minimap.vue';
import { storeToRefs } from 'pinia';
import Loading from '../widgets/Loading.vue';

// 统一用store管理全局参数
const pianoRollStore = usePianoRollStore();
const {
  barWidth,
  viewWidth,
  scrollLeft,
  bars,
  rowHeight,
  minimapWidth,
  beatsPerBar,
  quantization,
  tempo,
  mp3Offset,
} = storeToRefs(pianoRollStore);

const quantizationOptions = [
  { label: '全音符', value: 4 },
  { label: '二分音符', value: 2 },
  { label: '四分音符', value: 1 },
  { label: '八分音符', value: 0.5 },
  { label: '十六分音符', value: 0.25 },
  { label: '三十二分音符', value: 0.125 },
];

const rows = 88;

const { playNote, midiToNoteName, setInstrument } = useTone();
const editorStore = useEditorStore();
const router = useRouter();
const pianoGridRef = ref<InstanceType<typeof PianoGrid> | null>(null);
const isModalOpen = ref(false);
const generatedText = ref('');
const isPlaying = ref(false);
const isLoading = ref(false);

// Minimap自适应宽度相关
const minimapContainer = ref<HTMLElement | null>(null);

const route = useRoute();
const mode = computed(() => route.query.mode);
const type = computed(() => route.query.type);

// 用于mp3原始音频播放
const audioContext = ref<AudioContext | null>(null);
const audioSource = ref<AudioBufferSourceNode | null>(null);
const audioBuffer = computed(() => pianoRollStore.audioBufferForSpectrogram);
const isMp3Mode = computed(
  () => mode.value === 'time' && (!!audioBuffer.value || !!pianoRollStore.mp3File),
);
const mp3File = computed(() => pianoRollStore.mp3File);
let mp3Audio: HTMLAudioElement | null = null; // 用于直接播放mp3文件

// mp3Offset双向绑定store
const mp3OffsetProxy = computed({
  get: () => pianoRollStore.mp3Offset,
  set: (v) => pianoRollStore.setMp3Offset(Number(v) || 0),
});

// === 统一用store管理全局参数 ===

// Tap Tempo相关变量和方法全部在<script setup>中声明
const isTapModalOpen = ref(false);
const tapTimes = ref<number[]>([]);
const tapTempo = ref(0);
const tapAudio = ref<HTMLAudioElement | null>(null);
const tapIsPlaying = ref(false);

function openTapModal() {
  isTapModalOpen.value = true;
  tapTimes.value = [];
  tapTempo.value = 0;
  tapIsPlaying.value = false;
}
function closeTapModal() {
  isTapModalOpen.value = false;
  if (tapAudio.value) {
    tapAudio.value.pause();
    tapAudio.value.currentTime = 0;
    tapAudio.value = null;
  }
  tapIsPlaying.value = false;
}
function tapPlay() {
  if (tapAudio.value) {
    tapAudio.value.pause();
    tapAudio.value.currentTime = 0;
    tapAudio.value = null;
  }
  if (pianoRollStore.mp3File) {
    tapAudio.value = new Audio(URL.createObjectURL(pianoRollStore.mp3File));
    tapAudio.value.onended = () => (tapIsPlaying.value = false);
    tapAudio.value.play();
    tapIsPlaying.value = true;
  } else if (pianoRollStore.referenceNotes.length > 0) {
    tapIsPlaying.value = false;
  }
}
function tapStop() {
  if (tapAudio.value) {
    tapAudio.value.pause();
    tapAudio.value.currentTime = 0;
    tapAudio.value = null;
  }
  tapIsPlaying.value = false;
}
function onTap() {
  const now = Date.now();
  tapTimes.value.push(now);
  if (tapTimes.value.length > 1) {
    if (tapTimes.value.length > 8) tapTimes.value.shift();
    const intervals = tapTimes.value.slice(1).map((t, i) => t - tapTimes.value[i]);
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    tapTempo.value = Math.round(60000 / avg);
  }
}
function applyTapTempo() {
  if (tapTempo.value > 0) pianoRollStore.setTempo(tapTempo.value);
  closeTapModal();
}

// 监听主内容区宽度变化
onMounted(() => {
  /**
   * 统一初始化全局变量和模式类型
   * - mode/type 由路由参数驱动，并同步到store
   * - 不同模式下初始化不同的数据和状态
   */
  const modeParam = route.query.mode as 'bar' | 'time';
  const typeParam = route.query.type as 'new' | 'edit' | 'midi' | 'mp3';
  if (modeParam) pianoRollStore.setMode(modeParam);
  if (typeParam) pianoRollStore.setType(typeParam);
  pianoRollStore.setMode(modeParam || 'bar');
  pianoRollStore.setType(typeParam || 'new');
  pianoRollStore.clearAll();

  if (minimapContainer.value) {
    const resizeObserver = new window.ResizeObserver((entries) => {
      for (const entry of entries) {
        minimapWidth.value = entry.contentRect.width;
        // 默认显示8小节或全部，barWidth用整数像素，避免网格线模糊
        const defaultVisibleBars = Math.min(8, bars.value);
        barWidth.value = Math.floor(minimapWidth.value / defaultVisibleBars);
        viewWidth.value = barWidth.value * defaultVisibleBars;
        scrollLeft.value = 0;
        // 关键：此时所有参数已是最新，直接设置Minimap选区宽度与主编辑区严格对应
        const width = (viewWidth.value / (barWidth.value * bars.value)) * minimapWidth.value;
        pianoRollStore.setMinimapView(0, width);
      }
    });
    resizeObserver.observe(minimapContainer.value);
  }
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('wheel', handleWheel, { passive: false });
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('wheel', handleWheel);
});

// 监听Minimap选区变化，实时同步主编辑区
watch(
  [() => pianoRollStore.minimapViewLeft, () => pianoRollStore.minimapViewWidth],
  ([viewLeft, viewWidthPx]) => {
    let newVisibleBars = (viewWidthPx / minimapWidth.value) * bars.value;
    newVisibleBars = Math.max(2, Math.min(bars.value, newVisibleBars));
    // 全宽时严格铺满，允许barWidth为小数，消除右侧空白
    if (Math.abs(viewWidthPx - minimapWidth.value) < 1) {
      barWidth.value = minimapWidth.value / bars.value;
      viewWidth.value = minimapWidth.value;
      scrollLeft.value = 0;
    } else {
      barWidth.value = Math.floor(minimapWidth.value / newVisibleBars);
      viewWidth.value = barWidth.value * newVisibleBars;
      let newScrollLeft = Math.round(
        (viewLeft / minimapWidth.value) * (barWidth.value * bars.value),
      );
      newScrollLeft = Math.max(
        0,
        Math.min(newScrollLeft, barWidth.value * bars.value - viewWidth.value),
      );
      scrollLeft.value = newScrollLeft;
    }
    nextTick(() => {
      if (pianoGridRef.value && pianoGridRef.value.$el) {
        pianoGridRef.value.$el.scrollLeft = scrollLeft.value;
      }
    });
  },
);

// 监听barWidth变化，自动调整viewWidth
watch(
  () => barWidth.value,
  (newBarWidth) => {
    viewWidth.value = Math.min(bars.value * newBarWidth, viewWidth.value);
  },
);

// 监听tempo/beatsPerBar/audioBuffer变化，自动调整bars（仅midi/mp3导入模式）
watch(
  [
    () => pianoRollStore.tempo,
    () => pianoRollStore.beatsPerBar,
    () => pianoRollStore.audioBufferForSpectrogram,
    () => type.value === 'midi' || type.value === 'mp3',
    () => pianoRollStore.referenceNotes,
  ],
  ([tempo, beatsPerBar, audioBuffer, isMidiMp3, referenceNotes]: [
    number,
    number,
    AudioBuffer | null,
    boolean,
    PianoRollNote[],
  ]) => {
    if (!isMidiMp3) return; // 只在midi/mp3导入模式下生效
    let duration = 0;
    if (audioBuffer) {
      duration = audioBuffer.duration;
    } else if (referenceNotes && referenceNotes.length > 0) {
      // 用参考音符最大结束时间
      duration = Math.max(...referenceNotes.map((n: PianoRollNote) => n.start + n.duration));
    }
    if (duration > 0) {
      const secondsPerBar = (60 / tempo) * beatsPerBar;
      const bars = Math.ceil(duration / secondsPerBar);
      pianoRollStore.setBars(bars);
    }
  },
  { immediate: true },
);

// 进入midi/mp3导入模式时，自动初始化全局变量，避免使用上一次导入的遗留值
watch(
  () => mode.value,
  (isRef) => {
    if (isRef === 'time') {
      pianoRollStore.setTempo(120);
      pianoRollStore.setBeatsPerBar(4);
      pianoRollStore.setQuantization(1);
      pianoRollStore.setBarWidth(160);
      pianoRollStore.setViewWidth(960);
      pianoRollStore.setScrollLeft(0);
      pianoRollStore.setScrollTop(0);
      pianoRollStore.setBars(20);
      pianoRollStore.setRowHeight(24);
      pianoRollStore.setMinimapWidth(960);
      pianoRollStore.setMp3Offset(0);
    }
  },
);

// 修复timeline在time模式下初始化选区为一根竖线的问题
watch(
  [() => mode.value, () => pianoRollStore.bars, () => pianoRollStore.minimapWidth],
  ([isRef, bars, minimapWidth]) => {
    if (
      isRef === 'time' &&
      (pianoRollStore.minimapViewWidth < 10 || pianoRollStore.minimapViewWidth > minimapWidth)
    ) {
      // 默认选区为1/8宽度，且不小于80像素
      const defaultWidth = Math.max(minimapWidth / 8, 80);
      pianoRollStore.setMinimapView(0, defaultWidth);
    }
  },
  { immediate: true },
);

// convertPitchEventsToPianoRollNotes支持传入tempo
function convertPitchEventsToPianoRollNotes(
  pitchEvents: { note: string; time: number }[],
  tempo: number,
): PianoRollNote[] {
  if (!pitchEvents || pitchEvents.length === 0) {
    return [];
  }

  const notes: PianoRollNote[] = [];
  const noteMergeThresholdBeats = 0.2; // 小于这个节拍数的间隔将被合并
  const minNoteDurationSeconds = 0.05; // 过滤掉时值过短的音符

  let noteIndex = 0;
  let activeNote: {
    pitch: number;
    pitchName: string;
    startTime: number;
  } | null = null;

  // 添加一个终止事件，以确保最后一个音符能被正确处理
  const lastEventTime = pitchEvents[pitchEvents.length - 1]?.time || 0;
  const terminatedEvents = [...pitchEvents, { note: null, time: lastEventTime + 0.2 }];

  for (const event of terminatedEvents) {
    const pitchName = event.note;
    const pitch = pitchName ? SNTransition.General.noteNameToMidi(pitchName) : null;
    const currentTime = event.time;

    // 将判断条件拆解，以帮助 TS 进行正确的类型推断
    let hasChanged = false;
    if (activeNote) {
      // 如果有活动音符，检查音高是否变化
      hasChanged = pitch !== activeNote.pitch;
    } else if (pitch !== null) {
      // 如果没有活动音符，只要有新音高就算"变化"，以便开启第一个音符
      hasChanged = true;
    }

    if (hasChanged) {
      // 如果存在活动音符，说明它刚刚结束
      if (activeNote) {
        const durationInSeconds = currentTime - activeNote.startTime;

        if (durationInSeconds > minNoteDurationSeconds) {
          const startInBeats = (activeNote.startTime * tempo) / 60;
          const durationInBeats = (durationInSeconds * tempo) / 60;

          const lastNote = notes.length > 0 ? notes[notes.length - 1] : null;
          const timeSinceLastNoteEnd = lastNote
            ? startInBeats - (lastNote.start + lastNote.duration)
            : Infinity;

          // 检查此音符是否是前一个音符的延续
          if (
            lastNote &&
            lastNote.pitch === activeNote.pitch &&
            timeSinceLastNoteEnd >= 0 &&
            timeSinceLastNoteEnd < noteMergeThresholdBeats
          ) {
            // 是延续，则延长上一个音符
            lastNote.duration += durationInBeats + timeSinceLastNoteEnd;
          } else {
            // 否则，这是一个新的音符
            notes.push({
              index: noteIndex++,
              pitch: activeNote.pitch,
              pitchName: activeNote.pitchName,
              start: startInBeats,
              duration: durationInBeats,
            });
          }
        }
      }

      // 如果当前音高有效，则开启一个新的活动音符
      if (pitch && pitchName) {
        activeNote = {
          pitch,
          pitchName,
          startTime: currentTime,
        };
      } else {
        // 否则，重置活动音符
        activeNote = null;
      }
    }
  }

  return notes;
}

// 监听pitchEvents和tempo，任一变化时用当前tempo重新生成notes
watch(
  [() => pianoRollStore.pitchEvents, () => pianoRollStore.tempo],
  ([events, t]) => {
    if (events && events.length > 0) {
      const notes = convertPitchEventsToPianoRollNotes(events, t);
      pianoRollStore.setPianoRollNotes(notes);
    }
  },
  { immediate: true },
);

/**
 * 异步将乐谱文本转换为编曲工具的音符列表，并报告进度
 * @param scoreText 乐谱字符串
 * @param beatsPerBar 每小节拍数
 * @param onProgress 进度回调函数
 */
async function convertTextToNotesWithProgress(
  scoreText: string,
  beatsPerBar: number,
  onProgress?: (progress: number) => void,
): Promise<PianoRollNote[]> {
  return new Promise((resolve) => {
    // 预处理：移除和弦和装饰音标记
    const cleanedScoreText = scoreText.replace(/<[^>]*>|{[^}]*}/g, '');
    const measures = cleanedScoreText.replace(/\n/g, '|').split('|');
    const totalMeasures = measures.length;

    // 状态变量
    const notes: PianoRollNote[] = [];
    let currentBeat = 0;
    let noteIndex = 0;
    let lastNote: PianoRollNote | null = null;
    let measureIndex = 0;

    function processChunk() {
      const CHUNK_SIZE = 50; // 每帧处理50个小节
      const loopEnd = Math.min(measureIndex + CHUNK_SIZE, totalMeasures);

      for (; measureIndex < loopEnd; measureIndex++) {
        const measure = measures[measureIndex];
        if (!measure) continue;

        const noteStrings = measure.split(',').filter((n) => n.trim() !== '');
        for (const noteStr of noteStrings) {
          const trimmedNoteStr = noteStr.trim();
          if (trimmedNoteStr === '-') {
            // 这是延音线，增加前一个音符的持续时间
            if (lastNote) {
              lastNote.duration += 1;
            }
            currentBeat += 1;
            continue;
          }
          if (trimmedNoteStr === '0') {
            // 这是休止符，只增加时间
            currentBeat += 1;
            lastNote = null; // 休止符会断开延音
            continue;
          }

          // 解析音符
          const match = trimmedNoteStr.match(/(#?b?)([1-7])(\/(\d+))?([\^_]*)/);
          if (!match) continue;

          const [, accidental, noteValue, , durationNumStr, octaveMarks] = match;

          let upDownCount = 0;
          if (accidental === '#') upDownCount = 1;
          if (accidental === 'b') upDownCount = -1;

          const octaveCount =
            (octaveMarks?.match(/\^/g) || []).length - (octaveMarks?.match(/_/g) || []).length;

          let duration = 1; // 默认为四分音符
          if (durationNumStr) {
            duration = 4 / parseInt(durationNumStr, 10);
          }

          const noteName = SNTransition.General.simpleNoteToNoteName(
            noteValue,
            octaveCount,
            upDownCount,
          );
          if (noteName) {
            const pitch = SNTransition.General.noteNameToMidi(noteName);
            if (pitch !== null) {
              const newNote: PianoRollNote = {
                index: noteIndex++,
                pitch,
                pitchName: SNTransition.General.midiToNoteName(pitch) || '',
                start: currentBeat,
                duration: duration,
              };
              notes.push(newNote);
              lastNote = newNote;
            } else {
              lastNote = null; // 无效音高会断开延音
            }
          } else {
            lastNote = null; // 无效音名会断开延音
          }
          currentBeat += duration;
        }
      }

      onProgress?.((measureIndex / totalMeasures) * 100);

      if (measureIndex < totalMeasures) {
        requestAnimationFrame(processChunk);
      } else {
        resolve(notes);
      }
    }

    requestAnimationFrame(processChunk);
  });
}

/**
 * 加载音符数据并渲染到视图
 * @param notesToRender 要渲染的音符列表
 * @param beatsInfo 每小节的拍数
 */
function loadAndRenderNotes(notesToRender: PianoRollNote[], beatsInfo: number) {
  if (!pianoGridRef.value) return;

  // 1. 计算并设置总小节数
  let maxBeat = 0;
  if (notesToRender.length > 0) {
    maxBeat = Math.max(...notesToRender.map((note) => note.start + note.duration));
  }
  const requiredBars = Math.ceil(maxBeat / beatsInfo);
  bars.value = Math.max(20, requiredBars + 4);

  // 2. 更新视图
  pianoGridRef.value.setNotes(notesToRender);
  beatsPerBar.value = beatsInfo;
  tempo.value = parseInt(editorStore.formData.info.tempo || '120', 10);

  // 3. 将转换后的音符存入 store（如果它们还不在那里）
  if (pianoRollStore.pianoRollNotes !== notesToRender) {
    pianoRollStore.setPianoRollNotes(notesToRender);
  }
}

onMounted(() => {
  // Case 1: 从乐谱编辑器带数据过来，需要异步转换
  if (
    mode.value === 'bar' &&
    pianoRollStore.scoreToConvert &&
    pianoRollStore.beatsPerBarToConvert &&
    pianoGridRef.value
  ) {
    (async () => {
      isLoading.value = true;
      const notes = await convertTextToNotesWithProgress(
        pianoRollStore.scoreToConvert!,
        pianoRollStore.beatsPerBarToConvert!,
      );
      loadAndRenderNotes(notes, pianoRollStore.beatsPerBarToConvert!);
      isLoading.value = false;
      pianoRollStore.clearConversionData(); // 清理临时数据
    })();
  }
  // Case 2: 刷新页面或从其他页面返回，直接加载store中已有的数据
  else if (mode.value === 'bar' && pianoGridRef.value) {
    const beatsInfo = parseInt(editorStore.formData.info.beat || '4', 10);
    loadAndRenderNotes(pianoRollStore.pianoRollNotes, beatsInfo);
  }
  // Case 3: MIDI 参考模式
  else if (mode.value === 'time' && pianoGridRef.value) {
    const notes = pianoRollStore.referenceNotes;
    let maxBeat = 0;
    if (notes.length > 0) {
      maxBeat = Math.max(...notes.map((note) => note.start + note.duration));
    }
    // MIDI导入时，默认4/4拍
    const beatsPerBarValue = 4;
    const requiredBars = Math.ceil(maxBeat / beatsPerBarValue);
    bars.value = Math.max(20, requiredBars + 4);
  }
});

const goHome = () => {
  pianoRollStore.clearAll();
  router.push('/');
};

/**
 * 播放/停止，mp3模式下同步播放原始音频
 */
async function togglePlayback() {
  await Tone.start();

  if (isPlaying.value) {
    // 停止MIDI
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
    isPlaying.value = false;
    Tone.Transport.position = 0;
    // 停止mp3原始音频
    if (audioSource.value) {
      audioSource.value.stop();
      audioSource.value.disconnect();
      audioSource.value = null;
    }
    if (audioContext.value) {
      audioContext.value.close();
      audioContext.value = null;
    }
    // 停止mp3文件播放
    if (mp3Audio) {
      mp3Audio.pause();
      mp3Audio.currentTime = 0;
      mp3Audio = null;
    }
  } else {
    // 只播放实际绘制的音符（PianoGrid中的notes）
    const notes = pianoGridRef.value?.generateNotesList();
    // mp3模式下，如果没有绘制音符，也要播放完整mp3
    if ((!notes || notes.length === 0) && isMp3Mode.value) {
      if (mp3File.value) {
        if (mp3Audio) {
          mp3Audio.pause();
          mp3Audio = null;
        }
        mp3Audio = new Audio(URL.createObjectURL(mp3File.value));
        mp3Audio.currentTime = pianoRollStore.mp3Offset || 0;
        mp3Audio.onended = () => {
          isPlaying.value = false;
          mp3Audio = null;
        };
        mp3Audio.play();
        isPlaying.value = true;
        return;
      } else if (audioBuffer.value) {
        // 降级方案：用AudioBufferSourceNode播放
        audioContext.value = new window.AudioContext();
        audioSource.value = audioContext.value.createBufferSource();
        audioSource.value.buffer = audioBuffer.value;
        audioSource.value.connect(audioContext.value.destination);
        audioSource.value.start(0);
        isPlaying.value = true;
        audioSource.value.onended = () => {
          isPlaying.value = false;
          if (audioSource.value) {
            audioSource.value.disconnect();
            audioSource.value = null;
          }
          if (audioContext.value) {
            audioContext.value.close();
            audioContext.value = null;
          }
        };
        return;
      }
    }
    // 有实际绘制音符时才播放MIDI音符
    if (!notes || notes.length === 0) return;

    // 确保乐器加载完成再继续
    await setInstrument('piano');
    Tone.Transport.bpm.value = tempo.value;

    notes.forEach((note) => {
      const pitchName = midiToNoteName(note.pitch);
      const secondsPerBeat = 60 / tempo.value;
      const startTimeInSeconds = note.start * secondsPerBeat;
      const durationInSeconds = note.duration * secondsPerBeat;
      if (pitchName) {
        Tone.Transport.scheduleOnce((time) => {
          playNote(pitchName, durationInSeconds, time);
        }, startTimeInSeconds);
      }
    });

    const lastNote = notes.sort((a, b) => a.start + a.duration - (b.start + b.duration)).pop();
    if (!lastNote) return;
    const endTimeInSeconds = (lastNote.start + lastNote.duration) * (60 / tempo.value);

    Tone.Transport.scheduleOnce((time) => {
      Tone.Draw.schedule(() => {
        isPlaying.value = false;
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        // 停止mp3原始音频
        if (audioSource.value) {
          audioSource.value.stop();
          audioSource.value.disconnect();
          audioSource.value = null;
        }
        if (audioContext.value) {
          audioContext.value.close();
          audioContext.value = null;
        }
        if (mp3Audio) {
          mp3Audio.pause();
          mp3Audio = null;
        }
      }, time);
    }, endTimeInSeconds);

    // mp3模式下同步播放原始音频（如果有notes则同步播放）
    if (isMp3Mode.value) {
      if (mp3File.value) {
        if (mp3Audio) {
          mp3Audio.pause();
          mp3Audio = null;
        }
        mp3Audio = new Audio(URL.createObjectURL(mp3File.value));
        mp3Audio.currentTime = pianoRollStore.mp3Offset || 0;
        mp3Audio.onended = () => {
          isPlaying.value = false;
          Tone.Transport.stop();
          Tone.Transport.position = 0;
          mp3Audio = null;
        };
        mp3Audio.play();
      } else if (audioBuffer.value) {
        audioContext.value = new window.AudioContext();
        audioSource.value = audioContext.value.createBufferSource();
        audioSource.value.buffer = audioBuffer.value;
        audioSource.value.connect(audioContext.value.destination);
        audioSource.value.start(0);
        audioSource.value.onended = () => {
          isPlaying.value = false;
          Tone.Transport.stop();
          Tone.Transport.position = 0;
          if (audioSource.value) {
            audioSource.value.disconnect();
            audioSource.value = null;
          }
          if (audioContext.value) {
            audioContext.value.close();
            audioContext.value = null;
          }
        };
      }
    }

    Tone.Transport.start();
    isPlaying.value = true;
  }
}

/**
 * 将音符列表转换为模板文本
 * @param notes 音符数组
 * @param beatsPerBar 每小节的拍数
 */
function convertNotesToText(notes: any[], beatsPerBar: number) {
  if (notes.length === 0) {
    return '';
  }

  // 1. 设置时间轴的精度，这里用32分音符作为最小单位
  const resolution = 0.125;
  let maxBeat = 0;
  notes.forEach((note) => {
    maxBeat = Math.max(maxBeat, note.start + note.duration);
  });

  if (maxBeat === 0) return '';

  // 2. 创建一个向上取整到完整小节的时间轴
  const totalBars = Math.ceil(maxBeat / beatsPerBar) || 1;
  const totalBeats = totalBars * beatsPerBar;
  const slotsPerBeat = 1 / resolution;
  const totalSlots = Math.round(totalBeats * slotsPerBeat);
  const timeline = new Array(totalSlots).fill(null);

  // 3. 将音符放置到时间轴上，处理重叠（后来的音符/高音符优先）
  const sortedNotes = [...notes].sort((a, b) => a.start - b.start || b.pitch - a.pitch);
  for (const note of sortedNotes) {
    if (note.duration <= 0) continue;
    const startSlot = Math.round(note.start / resolution);
    const endSlot = Math.round((note.start + note.duration) / resolution);

    if (startSlot >= totalSlots) continue;

    timeline[startSlot] = note; // 放置音符头
    for (let i = startSlot + 1; i < endSlot; i++) {
      if (i < totalSlots) {
        timeline[i] = '-'; // 标记音符持续部分
      }
    }
  }

  // 4. 从时间轴生成乐谱字符串
  const bars: string[][] = Array.from({ length: totalBars }, () => []);
  let currentSlot = 0;

  while (currentSlot < totalSlots) {
    const item = timeline[currentSlot];
    let advanceSlots = 1;

    if (item === null) {
      // 处理休止符
      let restEndSlot = currentSlot + 1;
      while (restEndSlot < totalSlots && timeline[restEndSlot] === null) {
        restEndSlot++;
      }
      const restDuration = (restEndSlot - currentSlot) * resolution;
      let beatsLeft = restDuration;

      while (beatsLeft > 0) {
        const currentBeatStart =
          (currentSlot + (restDuration - beatsLeft) / resolution) * resolution;
        const barIndex = Math.floor(currentBeatStart / beatsPerBar);
        const beatInBar = currentBeatStart % beatsPerBar;

        const timeToNextBeat = 1 - (beatInBar - Math.floor(beatInBar));
        const restChunk = Math.min(beatsLeft, timeToNextBeat);

        const durationNum = 4 / restChunk;
        if (restChunk === 1) {
          bars[barIndex].push('0');
        } else if ([8, 16, 32].includes(durationNum)) {
          bars[barIndex].push(`0/${durationNum}`);
        }
        beatsLeft -= restChunk;
      }
      advanceSlots = restEndSlot - currentSlot;
    } else if (item === '-') {
      // 这是音符的延续，直接跳过
    } else {
      // 处理音符
      const note = item;
      const baseNoteStr = SNTransition.General.midiToSimpleNote(note.pitch) || '0';

      let noteEndSlot = currentSlot + 1;
      while (noteEndSlot < totalSlots && timeline[noteEndSlot] === '-') {
        noteEndSlot++;
      }
      const noteDurationBeats = (noteEndSlot - currentSlot) * resolution;
      advanceSlots = noteEndSlot - currentSlot;

      if (noteDurationBeats >= 1) {
        const integerBeats = Math.floor(noteDurationBeats);
        const noteStartBeat = currentSlot * resolution;
        const firstBarIndex = Math.floor(noteStartBeat / beatsPerBar);
        bars[firstBarIndex].push(baseNoteStr);

        for (let i = 1; i < integerBeats; i++) {
          const dashBeat = noteStartBeat + i;
          const dashBarIndex = Math.floor(dashBeat / beatsPerBar);
          bars[dashBarIndex].push('-');
        }
      } else {
        const barIndex = Math.floor((currentSlot * resolution) / beatsPerBar);
        const durationNum = 4 / noteDurationBeats;
        if ([8, 16, 32].includes(durationNum)) {
          bars[barIndex].push(`${baseNoteStr}/${durationNum}`);
        } else {
          bars[barIndex].push(baseNoteStr);
        }
      }
    }
    currentSlot += advanceSlots;
  }

  // 5. 格式化输出，带自动换行逻辑
  let output = '';
  let measuresInLine = 0;
  let notesInLine = 0;
  for (let i = 0; i < bars.length; i++) {
    const barContent = bars[i].join(',');
    if (barContent) {
      output += barContent;
      notesInLine += bars[i].length;
      measuresInLine++;

      const isLastBar = i === bars.length - 1;
      if (!isLastBar) {
        if (measuresInLine >= 4 || notesInLine >= 16) {
          output += '\n';
          measuresInLine = 0;
          notesInLine = 0;
        } else {
          output += '|';
        }
      }
    }
  }

  return output;
}

function onGenerateClick() {
  if (pianoGridRef.value) {
    const notesList = pianoGridRef.value.generateNotesList();
    generatedText.value = convertNotesToText(notesList, beatsPerBar.value);
    isModalOpen.value = true;
  }
}

/**
 * 完成编辑，返回首页
 */
function completeEditing() {
  if (pianoGridRef.value) {
    const notesList = pianoGridRef.value.generateNotesList();
    const scoreText = convertNotesToText(notesList, beatsPerBar.value);
    editorStore.updateScore(scoreText); // 只更新乐谱文本
    pianoRollStore.clearAll(); // 重置标志位
    router.push('/');
  }
}

/**
 * 从当前编曲创建新的乐谱并跳转到首页
 */
function createNewScoreFromArrangement() {
  if (!pianoGridRef.value) return;

  const notesList = pianoGridRef.value.generateNotesList();
  const scoreText = convertNotesToText(notesList, beatsPerBar.value);

  const newScoreData: SNTemplate = {
    info: {
      title: '未命名',
      composer: '未命名',
      lyricist: '未命名',
      author: '未命名',
      key: 'C',
      time: '4',
      beat: beatsPerBar.value.toString(),
      tempo: tempo.value.toString(),
    },
    score: scoreText,
    lyric: '',
  };

  editorStore.updateFormData(newScoreData);
  pianoRollStore.clearAll();
  router.push('/');
}

// 快捷键和滚轮缩放逻辑
function handleKeydown(e: KeyboardEvent) {
  // 空格键播放/暂停
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayback();
  }
}

function handleWheel(e: WheelEvent) {
  // Ctrl+滚轮缩放选区
  if (e.ctrlKey) {
    e.preventDefault();
    // 以Minimap选区为中心缩放，比例10%
    const scaleStep = 0.1;
    let newWidth = pianoRollStore.minimapViewWidth;
    if (e.deltaY < 0) {
      // 向上滚动，缩小（选区变窄）
      newWidth = Math.max(minimapWidth.value * 0.1, newWidth * (1 - scaleStep));
    } else {
      // 向下滚动，放大（选区变宽）
      newWidth = Math.min(minimapWidth.value, newWidth * (1 + scaleStep));
    }
    // 保持选区中心不变
    const center = pianoRollStore.minimapViewLeft + pianoRollStore.minimapViewWidth / 2;
    let newLeft = center - newWidth / 2;
    // 边界处理
    newLeft = Math.max(0, Math.min(newLeft, minimapWidth.value - newWidth));
    pianoRollStore.setMinimapView(newLeft, newWidth);
  }
}
</script>
