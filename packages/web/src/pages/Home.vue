<template>
  <PanelOperate
    ref="panelOperateRef"
    :sheet-key="editorStore.formData.info.key"
    @import-file="handleImportFile"
    @export-file="handleExportFile"
    @new-sheet="handleNewSheet"
  />
  <PanelTools />
  <PanelInstrument />
  <div
    class="max-w-[1200px] mt-5 mx-auto w-full h-auto max-h-[800px] flex min-h-[70vh] gap-5 flex-row max-[1200px]:flex-col-reverse max-[1200px]:w-auto max-[1200px]:max-h-max max-[1200px]:overflow-x-auto"
  >
    <PanelEditor />
    <div
      id="auto-scroll-container"
      class="bg-white min-[1200px]:min-w-[730px] max-[1200px]:max-h-[800px] bg-opacity-95 rounded-lg shadow-md relative backdrop-blur-sm overflow-x-hidden overflow-y-auto flex-1"
    >
      <div id="container" ref="container"></div>
    </div>
  </div>
  <PanelAudio />
  <PanelExample @load-example="loadExample" />
  <PanelSyntax />
  <PanelQa />
  <PanelRoadmap />
  <NoteContextMenu
    :isVisible="isContextMenuVisible"
    :x="contextMenuX"
    :y="contextMenuY"
    :noteData="contextMenuNoteData"
    @close="isContextMenuVisible = false"
  />
  <Modal :is-open="isAnalyzing" :show-close-button="false" title="音频分析">
    <div class="p-4 text-center">
      <p class="text-lg font-medium text-gray-700 mb-4">正在分析音高，请稍候...</p>
      <div class="w-full bg-gray-200 rounded-full h-4">
        <div
          class="bg-blue-500 h-4 rounded-full transition-all duration-150"
          :style="{ width: `${analysisProgress}%` }"
        ></div>
      </div>
      <p class="text-sm text-gray-500 mt-2">{{ analysisProgress.toFixed(0) }}%</p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import {
  SimpleNotation,
  SNDataType,
  SNRuntime,
  type SNTemplate,
  type SNOptions,
  SNTransition,
  SNPointerLayer,
  SNNote,
} from 'simple-notation';
import { shallowRef, type Ref } from 'vue';
import PanelEditor from '../components/editor/PanelEditor.vue';
import PanelSyntax from '../components/PanelSyntax.vue';
import PanelExample from '../components/PanelExample.vue';
import PanelRoadmap from '../components/PanelRoadmap.vue';
import PanelOperate from '../components/PanelOperate.vue';
import PanelQa from '../components/PanelQa.vue';
import NoteContextMenu from '../components/NoteContextMenu.vue';
import PanelInstrument from '../components/instrument/PanelInstrument.vue';
import PanelAudio from '../components/audio/PanelAudio.vue';
import PanelTools from '../components/PanelTools.vue';
import {
  useEditorStore,
  useGuitarStore,
  usePianoRollStore,
  usePianoStore,
  type PianoRollNote,
} from '../stores';
import { usePlayer } from '../use/usePlayer';
import { Midi } from '@tonejs/midi';
import type { Example } from '../model';
import { useTone } from '../use';
import { useRouter } from 'vue-router';
import Modal from '../widgets/Modal.vue';

defineOptions({
  name: 'Home',
});

const panelOperateRef: Ref<InstanceType<typeof PanelOperate> | null> = ref(null);

const sn = shallowRef<SimpleNotation | null>(null);
const container = ref<HTMLDivElement | null>(null);
const editorStore = useEditorStore();
const pianoStore = usePianoStore();
const guardStore = useGuitarStore();
const pianoRollStore = usePianoRollStore();
const router = useRouter();
const { stop } = usePlayer();

/**
 * 加载示例的方法，支持模板和abc类型
 * @param {Example} example - 示例文件
 */
const loadExample = async (example: Example) => {
  stop();
  pianoStore.clearMelodyHighlightMidis();
  pianoStore.clearChordHighlightMidis();
  guardStore.clearMelodyHighlightMidis();
  guardStore.clearChordHighlightMidis();
  try {
    // 判断类型，决定加载方式
    if (example.type === SNDataType.ABC) {
      // abc类型
      const path = `/score/abc/【Simple-Notation】${example.name}.txt`;
      const response = await fetch(path);
      const abcText = await response.text();
      editorStore.updateAbcStr(abcText);
      editorStore.setActiveInputType(SNDataType.ABC);
    } else {
      // 模板类型
      const path = `/score/template/【Simple-Notation】${example.name}.json`;
      const response = await fetch(path);
      const exampleData = await response.json();
      editorStore.updateFormData(exampleData);
      editorStore.setActiveInputType(SNDataType.TEMPLATE);
      if (example.hasConf) {
        const response = await fetch(path.replace('.json', '.conf.json'));
        const exampleConf = await response.json();
        editorStore.updateSnOptions(exampleConf);
      } else {
        // 重置 snOptions 为默认值
        editorStore.resetSnOptions();
      }
    }
  } catch (error) {
    console.error('加载示例失败:', error);
  }
};

watch(
  () => editorStore.formData,
  () => {
    if (editorStore.activeInputType === SNDataType.TEMPLATE) {
      sn.value?.loadData(editorStore.formData);
    }
  },
  { deep: true },
);

// 监听 snOptions 变化并更新 SN 实例
watch(
  () => editorStore.snOptions,
  (newOptions) => {
    console.log('SN Options Updated:', newOptions);
    // updateOptions 接受 Partial<SNOptions>，所以直接传递 newOptions 是安全的
    sn.value?.updateOptions(newOptions as SNOptions);
  },
  { deep: true },
);

watch(
  () => editorStore.activeInputType,
  () => {
    stop();
    if (editorStore.activeInputType === SNDataType.ABC) {
      sn.value?.loadData(editorStore.abcStr, SNDataType.ABC);
    } else {
      sn.value?.loadData(editorStore.formData);
    }
  },
);

watch(
  () => editorStore.abcStr,
  () => {
    if (editorStore.activeInputType === SNDataType.ABC) {
      sn.value?.loadData(editorStore.abcStr, SNDataType.ABC);
    }
  },
);

const { setEditorSelection } = useEditorStore();

const initSn = (container: HTMLDivElement) => {
  // 初始化 SN 时传入当前 snOptions 的值
  sn.value = new SimpleNotation(container, editorStore.snOptions as SNOptions);
  sn.value.loadData(editorStore.formData);
  sn.value?.on('note:click', (event) => {
    const note = event.detail.note;
    const [start, end] = note.getTextRange();
    if (start !== undefined && end !== undefined) {
      setEditorSelection(start, end);
    }
  });
  // 添加右键点击监听
  sn.value?.on('note:contextmenu', (event) => {
    if (SNPointerLayer.selectedNoteRectMap.size > 0) {
      let isClickSelectedNote = false;
      const indices = Array.from(SNPointerLayer.selectedNoteRectMap.keys()).flat();
      const notes = indices
        .map((idx) => {
          if (idx === event.detail.note.index) {
            isClickSelectedNote = true;
          }
          return SNPointerLayer.noteInstanceMap.get(idx);
        })
        .filter((n): n is SNNote => !!n);
      if (!isClickSelectedNote) return;
      contextMenuNoteData.value = notes;
    } else {
      // 单音符右键
      contextMenuNoteData.value = event.detail.note;
    }
    isContextMenuVisible.value = true;
    contextMenuX.value = event.detail.e.pageX + 20;
    contextMenuY.value = event.detail.e.pageY + 10;
  });
};

onMounted(() => {
  if (!container.value) {
    throw new Error('Container DOM element not found');
  }
  initSn(container.value);
  window.addEventListener('click', hideContextMenuOnOutsideClick);
  if (!editorStore.formData.score.trim() && !editorStore.formData.lyric?.trim()) {
    loadExample({
      name: '小星星',
      type: SNDataType.TEMPLATE,
      hasConf: false,
      isFinished: true,
    });
  }
});

onBeforeUnmount(() => {
  sn.value?.destroy();
  window.removeEventListener('click', hideContextMenuOnOutsideClick);
});

const isContextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuNoteData = ref<null | SNNote | SNNote[]>(null);
const hideContextMenuOnOutsideClick = () => {
  isContextMenuVisible.value = false;
};

// --- 音频分析进度 ---
const isAnalyzing = ref(false);
const analysisProgress = ref(0);

/**
 * 处理导出乐谱文件
 * @returns {void}
 */
function handleExportFile() {
  let dataStr = '';
  let ext = '';
  let fileName = '';
  if (editorStore.activeInputType === SNDataType.ABC) {
    dataStr = editorStore.abcStr;
    ext = 'txt';
  } else {
    dataStr = JSON.stringify(editorStore.formData, null, 2);
    ext = 'json';
  }
  fileName = `【Simple-Notation】${SNRuntime.getTitle() || '未命名曲谱'}.${ext}`;
  const blob = new Blob([dataStr], {
    type: ext === 'json' ? 'application/json' : 'text/plain',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

const { analyzeMp3Pitch } = useTone();

/**
 * 处理导入文件事件
 * @param {File} file - 导入的文件对象
 * @param {string | ArrayBuffer | any | null} data - 读取到的文件内容 (字符串, ArrayBuffer, 或解析后的对象)
 * @param {string} type - 文件的MIME类型
 */
async function handleImportFile(file: File, data: string | ArrayBuffer | any | null, type: string) {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.json')) {
    const parsedData = JSON.parse(data);
    editorStore.updateFormData(parsedData);
    editorStore.setActiveInputType(SNDataType.TEMPLATE);
  } else if (fileName.endsWith('.txt')) {
    editorStore.updateAbcStr(data);
    editorStore.setActiveInputType(SNDataType.ABC);
  } else if (fileName.endsWith('.mid') || fileName.endsWith('.midi')) {
    // 处理 MIDI 文件
    if (data instanceof ArrayBuffer) {
      try {
        const midiData = new Midi(data);
        const notes = convertMidiToPianoRollNotes(midiData);
        pianoRollStore.setReferenceNotes(notes);
        router.push({ path: '/piano-roll', query: { mode: 'time', type: 'midi' } });
      } catch (error) {
        console.error('Error parsing MIDI file:', error);
      }
    } else {
      console.error('Expected ArrayBuffer data for MIDI file, but received', typeof data);
    }
  } else if (fileName.endsWith('.mp3')) {
    // 处理mp3音频文件，自动音高分析
    if (data instanceof ArrayBuffer) {
      isAnalyzing.value = true;
      analysisProgress.value = 0;
      try {
        const { pitchEvents, decodedAudioData } = await analyzeMp3Pitch(data, (progress) => {
          analysisProgress.value = progress;
        });
        // pitchEvents和referenceNotes都要保存，referenceNotes用默认tempo=120生成
        pianoRollStore.setAudioBufferForSpectrogram(decodedAudioData);
        pianoRollStore.setPitchEvents(pitchEvents);
        const notes = convertPitchEventsToPianoRollNotes(pitchEvents, 120);
        pianoRollStore.setReferenceNotes(notes);
        pianoRollStore.setMp3File(file);
        router.push({ path: '/piano-roll', query: { mode: 'time', type: 'mp3' } });
      } catch (error) {
        console.error('MP3音高分析失败:', error);
      } finally {
        isAnalyzing.value = false;
      }
    } else {
      console.error('Expected ArrayBuffer data for MP3 file, but received', typeof data);
    }
  } else {
    // 处理其他不支持的文件类型
    console.warn('Unsupported file type imported:', file.name, 'Type:', type);
  }
}

/**
 * 将解析后的 MIDI 数据转换为 PianoRollNote 数组
 * @param {Midi} midiData - 解析后的 MIDI 数据对象
 * @returns {import('@/stores').PianoRollNote[]} 转换后的音符数组
 */
function convertMidiToPianoRollNotes(midiData: Midi) {
  const notes: PianoRollNote[] = [];
  const tempo = midiData.header.tempos[0]?.bpm || 120; // 获取速度，默认为120
  let noteIndex = 0;

  midiData.tracks.forEach((track) => {
    track.notes.forEach((note) => {
      // 将音符的开始时间（秒）和持续时间（秒）转换为节拍数
      const startInBeats = (note.time * tempo) / 60;
      const durationInBeats = (note.duration * tempo) / 60;

      notes.push({
        index: noteIndex++,
        pitch: note.midi,
        pitchName: note.name,
        start: startInBeats,
        duration: durationInBeats,
      });
    });
  });

  return notes;
}

// ========== 工具函数：MP3音高事件转音符，支持tempo参数 ==========
/**
 * 将音高事件数组转换为 PianoRollNote 数组，支持自定义tempo
 * @param pitchEvents 音高事件数组
 * @param tempo 当前速度
 * @returns PianoRollNote[]
 */
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
    let hasChanged = false;
    if (activeNote) {
      hasChanged = pitch !== activeNote.pitch;
    } else if (pitch !== null) {
      hasChanged = true;
    }
    if (hasChanged) {
      if (activeNote) {
        const durationInSeconds = currentTime - activeNote.startTime;
        if (durationInSeconds > minNoteDurationSeconds) {
          const startInBeats = (activeNote.startTime * tempo) / 60;
          const durationInBeats = (durationInSeconds * tempo) / 60;
          const lastNote = notes.length > 0 ? notes[notes.length - 1] : null;
          const timeSinceLastNoteEnd = lastNote
            ? startInBeats - (lastNote.start + lastNote.duration)
            : Infinity;
          if (
            lastNote &&
            lastNote.pitch === activeNote.pitch &&
            timeSinceLastNoteEnd >= 0 &&
            timeSinceLastNoteEnd < noteMergeThresholdBeats
          ) {
            lastNote.duration += durationInBeats + timeSinceLastNoteEnd;
          } else {
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
      if (pitch && pitchName) {
        activeNote = {
          pitch,
          pitchName,
          startTime: currentTime,
        };
      } else {
        activeNote = null;
      }
    }
  }
  return notes;
}

/**
 * 处理新建乐谱
 */
function handleNewSheet() {
  // 重置为默认的空白乐谱
  editorStore.updateFormData({
    info: {
      title: '',
      composer: '',
      lyricist: '',
      time: '',
      tempo: '',
      key: undefined,
      beat: '',
    },
    score: '',
    lyric: '',
  });
  editorStore.updateAbcStr('');
  editorStore.setActiveInputType(SNDataType.TEMPLATE);
}
</script>
