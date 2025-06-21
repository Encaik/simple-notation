<template>
  <Card>
    <template v-slot:title>
      <div class="flex justify-between items-center w-full">
        <span>{{ editorStore.isEditingFromScoreEditor ? '编辑乐谱' : '编曲文本转换工具' }}</span>
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
          <Button v-if="editorStore.isEditingFromScoreEditor" @click="completeEditing"
            >完成编辑</Button
          >
          <template v-else>
            <Button @click="onGenerateClick">生成模板文本</Button>
            <Button @click="createNewScoreFromArrangement">以此新建乐谱</Button>
            <Button @click="goHome">返回首页</Button>
          </template>
        </div>
      </div>
    </template>
    <div class="h-[90vh] w-full flex bg-gray-700 rounded-md overflow-hidden">
      <PianoKeyboard class="w-16 flex-shrink-0" />
      <div class="flex flex-col flex-1 w-0">
        <PianoTimeLine
          :bars="bars"
          :barWidth="barWidth"
          :rowHeight="rowHeight"
          :beatsPerBar="beatsPerBar"
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
import PianoKeyboard from '../components/PianoKeyboard.vue';
import PianoGrid from '../components/PianoGrid.vue';
import PianoTimeLine from '../components/PianoTimeLine.vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { SNTransition, type SNTemplate } from 'simple-notation';
import * as Tone from 'tone';
import { useTone } from '@/use';
import { useEditorStore } from '@/stores';

const { playNote, midiToNoteName, setInstrument } = useTone();
const editorStore = useEditorStore();

const router = useRouter();
const pianoGridRef = ref<InstanceType<typeof PianoGrid> | null>(null);
const isModalOpen = ref(false);
const generatedText = ref('');
const isPlaying = ref(false);
const tempo = ref(120);

onMounted(() => {
  // 如果是从乐谱编辑器跳转过来的，则加载传入的音符
  if (editorStore.isEditingFromScoreEditor && pianoGridRef.value) {
    pianoGridRef.value.setNotes(editorStore.pianoRollNotes);
    beatsPerBar.value = parseInt(editorStore.formData.info.beat || '4', 10);
    tempo.value = parseInt(editorStore.formData.info.tempo || '120', 10);
  }
});

const goHome = () => {
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
    editorStore.isEditingFromScoreEditor = false; // 重置标志位
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

const bars = 20;
const barWidth = 160;
const beatsPerBar = ref(4);
const quantization = ref(1); // 每格代表的拍数，1代表四分音符
const rows = 88;
const rowHeight = 24;
</script>
