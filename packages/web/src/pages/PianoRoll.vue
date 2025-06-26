<template>
  <Card>
    <template v-slot:title>
      <div class="flex justify-between items-center w-full">
        <span>{{
          pianoRollStore.isEditingFromScoreEditor
            ? '编辑乐谱'
            : pianoRollStore.isEditingWithMidiReference
              ? '导入文件参考编曲'
              : '编曲文本转换工具'
        }}</span>
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
          <Button v-if="pianoRollStore.isEditingFromScoreEditor" @click="completeEditing"
            >完成编辑</Button
          >
          <Button v-if="!pianoRollStore.isEditingFromScoreEditor" @click="onGenerateClick"
            >生成模板文本</Button
          >
          <Button
            v-if="!pianoRollStore.isEditingFromScoreEditor"
            @click="createNewScoreFromArrangement"
            >以此新建乐谱</Button
          >
          <Button @click="goHome">返回首页</Button>
        </div>
      </div>
    </template>
    <div class="h-[90vh] w-full flex bg-gray-700 rounded-md overflow-hidden relative">
      <!-- 加载遮罩 -->
      <div
        v-if="isLoading"
        class="absolute inset-0 bg-gray-800 bg-opacity-75 flex flex-col justify-center items-center z-20"
      >
        <p class="text-white text-lg mb-4">正在加载乐谱...</p>
        <div class="w-1/2 bg-gray-600 rounded-full h-2.5">
          <div
            class="bg-blue-500 h-2.5 rounded-full"
            :style="{ width: `${loadingProgress}%` }"
          ></div>
        </div>
        <p class="text-white mt-2">{{ loadingProgress.toFixed(0) }}%</p>
      </div>

      <PianoKeyboard class="w-16 flex-shrink-0" />
      <div class="flex flex-col flex-1 w-0" ref="minimapContainer">
        <PianoTimeLine
          :bars="bars"
          :barWidth="barWidth"
          :rowHeight="rowHeight"
          :beatsPerBar="beatsPerBar"
        />
        <!-- Minimap 缩略图组件 -->
        <Minimap
          :bars="bars"
          :minimapWidth="minimapWidth"
          :viewLeft="minimapViewLeft"
          :viewWidth="minimapViewWidth"
          @updateView="onMinimapViewChange"
        />
        <PianoGrid
          ref="pianoGridRef"
          class="flex-1 overflow-auto"
          :bars="bars"
          :barWidth="barWidth"
          :beatsPerBar="beatsPerBar"
          :quantization="quantization"
          :rows="rows"
          :rowHeight="rowHeight"
          :tempo="tempo"
          :referenceNotes="pianoRollStore.referenceNotes"
          :audio-buffer="pianoRollStore.audioBufferForSpectrogram"
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
</template>

<script setup lang="ts">
import Button from '../widgets/Button.vue';
import PianoKeyboard from '../components/piano-roll/PianoKeyboard.vue';
import PianoGrid from '../components/piano-roll/PianoGrid.vue';
import PianoTimeLine from '../components/piano-roll/PianoTimeLine.vue';
import { ref, onMounted, watch, nextTick, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { SNTransition, type SNTemplate } from 'simple-notation';
import * as Tone from 'tone';
import { useTone } from '@/use';
import { useEditorStore, usePianoRollStore, type PianoRollNote } from '@/stores';
import Minimap from '../components/piano-roll/Minimap.vue';

// 先声明所有会被函数引用的ref变量，避免变量提升导致的未初始化错误
const bars = ref(20);
const barWidth = ref(160);
const beatsPerBar = ref(4);
const quantization = ref(1); // 每格代表的拍数，1代表四分音符
const rows = 88;
const rowHeight = 24;

const { playNote, midiToNoteName, setInstrument } = useTone();
const editorStore = useEditorStore();
const pianoRollStore = usePianoRollStore();
const router = useRouter();
const pianoGridRef = ref<InstanceType<typeof PianoGrid> | null>(null);
const isModalOpen = ref(false);
const generatedText = ref('');
const isPlaying = ref(false);
const tempo = ref(120);
const isLoading = ref(false);
const loadingProgress = ref(0);

// 编辑区横向滚动和缩放相关状态
const scrollLeft = ref(0); // 当前横向滚动位置（像素）
const viewWidth = ref(960); // 当前可视区宽度（像素），初始为960px

// Minimap自适应宽度相关
const minimapContainer = ref<HTMLElement | null>(null);
const minimapWidth = ref(960); // 初始值，后续自适应

// 主编辑区实际像素宽度（容器宽度，整数像素）
const gridWidth = computed(() => Math.round(barWidth.value * bars.value));
// 当前可视小节数
const visibleBars = computed(() => viewWidth.value / barWidth.value);
// Minimap选区宽度 = 可视小节数 / 总小节数 * minimapWidth
const minimapViewWidth = computed(() => (visibleBars.value / bars.value) * minimapWidth.value);
// Minimap选区左侧 = scrollLeft / (barWidth * bars) * minimapWidth
const minimapViewLeft = computed(
  () => (scrollLeft.value / (barWidth.value * bars.value)) * minimapWidth.value,
);

// 监听主内容区宽度变化
onMounted(() => {
  if (minimapContainer.value) {
    const resizeObserver = new window.ResizeObserver((entries) => {
      for (const entry of entries) {
        minimapWidth.value = entry.contentRect.width;
        // 默认显示8小节或全部，barWidth用整数像素，避免网格线模糊
        const defaultVisibleBars = Math.min(8, bars.value);
        barWidth.value = Math.floor(minimapWidth.value / defaultVisibleBars);
        viewWidth.value = barWidth.value * defaultVisibleBars;
        scrollLeft.value = 0;
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

// 编辑区总宽度
const totalContentWidth = computed(() => bars.value * barWidth.value);

// 监听PianoGrid滚动，自动同步scrollLeft
function onGridScroll(e: Event) {
  if (!e.target) return;
  const target = e.target as HTMLDivElement;
  scrollLeft.value = target.scrollLeft;
}

// Minimap选区变化时，联动主编辑区滚动和缩放
function onMinimapViewChange(viewLeft: number, viewWidthPx: number) {
  let newVisibleBars = (viewWidthPx / minimapWidth.value) * bars.value;
  newVisibleBars = Math.max(2, Math.min(bars.value, newVisibleBars));
  if (newVisibleBars >= bars.value - 0.01) {
    // 选区最大，barWidth和gridWidth都为整数像素
    barWidth.value = Math.floor(minimapWidth.value / bars.value);
    viewWidth.value = barWidth.value * bars.value;
    scrollLeft.value = 0;
  } else {
    barWidth.value = Math.floor(minimapWidth.value / newVisibleBars);
    viewWidth.value = barWidth.value * newVisibleBars;
    let newScrollLeft = Math.round((viewLeft / minimapWidth.value) * (barWidth.value * bars.value));
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
}

// 监听barWidth变化，自动调整viewWidth
watch(
  () => barWidth.value,
  (newBarWidth) => {
    viewWidth.value = Math.min(bars.value * newBarWidth, viewWidth.value);
  },
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
  onProgress: (progress: number) => void,
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

      onProgress((measureIndex / totalMeasures) * 100);

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
    pianoRollStore.isEditingFromScoreEditor &&
    pianoRollStore.scoreToConvert &&
    pianoRollStore.beatsPerBarToConvert &&
    pianoGridRef.value
  ) {
    (async () => {
      isLoading.value = true;
      loadingProgress.value = 0;
      const notes = await convertTextToNotesWithProgress(
        pianoRollStore.scoreToConvert!,
        pianoRollStore.beatsPerBarToConvert!,
        (progress) => {
          loadingProgress.value = progress;
        },
      );
      loadAndRenderNotes(notes, pianoRollStore.beatsPerBarToConvert!);
      isLoading.value = false;
      pianoRollStore.clearConversionData(); // 清理临时数据
    })();
  }
  // Case 2: 刷新页面或从其他页面返回，直接加载store中已有的数据
  else if (pianoRollStore.isEditingFromScoreEditor && pianoGridRef.value) {
    const beatsInfo = parseInt(editorStore.formData.info.beat || '4', 10);
    loadAndRenderNotes(pianoRollStore.pianoRollNotes, beatsInfo);
  }
  // Case 3: MIDI 参考模式
  else if (pianoRollStore.isEditingWithMidiReference && pianoGridRef.value) {
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
 * 播放/停止
 */
async function togglePlayback() {
  await Tone.start();

  if (isPlaying.value) {
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
    isPlaying.value = false;
    Tone.Transport.position = 0;
  } else {
    const notes = pianoGridRef.value?.generateNotesList();
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
      }, time);
    }, endTimeInSeconds);

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

const quantizationOptions = [
  { label: '全音符', value: 4 },
  { label: '二分音符', value: 2 },
  { label: '四分音符', value: 1 },
  { label: '八分音符', value: 0.5 },
  { label: '十六分音符', value: 0.25 },
  { label: '三十二分音符', value: 0.125 },
];

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
    // 计算缩放比例，deltaY<0为放大，>0为缩小
    const scaleStep = 0.1; // 每次缩放10%
    let newViewWidth = viewWidth.value;
    if (e.deltaY < 0) {
      // 放大（选区变宽）
      newViewWidth = Math.min(gridWidth.value, viewWidth.value * (1 + scaleStep));
    } else {
      // 缩小（选区变窄）
      newViewWidth = Math.max(barWidth.value * 2, viewWidth.value * (1 - scaleStep));
    }
    // 反算barWidth和可视小节数
    const newVisibleBars = newViewWidth / barWidth.value;
    barWidth.value = Math.floor(gridWidth.value / newVisibleBars);
    viewWidth.value = barWidth.value * newVisibleBars;
    // 保证scrollLeft不超出
    scrollLeft.value = Math.max(0, Math.min(scrollLeft.value, gridWidth.value - viewWidth.value));
  }
}
</script>
