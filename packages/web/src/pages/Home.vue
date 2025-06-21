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
import { useEditorStore, useGuitarStore, usePianoRollStore, usePianoStore } from '../stores';
import { usePlayer } from '../use/usePlayer';
import { Midi } from '@tonejs/midi';
import type { Example } from '../model';
import { useTone } from '../use';
import { useRouter } from 'vue-router';

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
        pianoRollStore.setIsEditingWithMidiReference(true);
        router.push('/piano-roll');
      } catch (error) {
        console.error('Error parsing MIDI file:', error);
      }
    } else {
      console.error('Expected ArrayBuffer data for MIDI file, but received', typeof data);
    }
  } else if (fileName.endsWith('.mp3')) {
    // 处理mp3音频文件，自动音高分析
    if (data instanceof ArrayBuffer) {
      try {
        // 调用pitchy分析方法，输出音符列表
        const noteList = await analyzeMp3Pitch(data);
        let scoreStr = '';
        let measureCount = 0;
        noteList.forEach((note, index) => {
          const simpleNote = SNTransition.General.noteNameToSimpleNote(note.note);
          if (simpleNote) {
            scoreStr += simpleNote;
            if (index !== 0 && index % 4 === 0) {
              scoreStr += '|';
              measureCount++;
            } else {
              scoreStr += ',';
            }
            if (measureCount !== 0 && measureCount % 4 === 0) {
              scoreStr += '\n';
              measureCount = 0;
            }
          }
        });
        editorStore.updateFormData({
          info: {
            title: fileName,
          },
          score: scoreStr,
          lyric: '',
        });
      } catch (error) {
        console.error('MP3音高分析失败:', error);
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
  const notes: import('@/stores').PianoRollNote[] = [];
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
