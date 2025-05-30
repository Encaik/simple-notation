<template>
  <Header />
  <PanelOperate
    ref="panelOperateRef"
    :sheet-key="formData.info.key"
    @import-file="handleImportFile"
    @export-file="handleExportFile"
  />
  <PanelInstrument />
  <div
    class="max-w-[1200px] mt-5 mx-auto w-full h-auto max-h-[800px] flex min-h-[70vh] gap-5 flex-row max-[1200px]:flex-col-reverse max-[1200px]:w-auto max-[1200px]:max-h-max max-[1200px]:overflow-x-auto"
  >
    <PanelEditor
      v-model:formData="formData"
      v-model:abcStr="abcStr"
      :inputType="inputType"
      @change-type="(val) => (inputType = val)"
    />
    <div
      id="container"
      ref="container"
      class="bg-white min-[1200px]:min-w-[730px] max-[1200px]:max-h-[800px] bg-opacity-95 rounded-lg shadow-md relative backdrop-blur-sm overflow-x-hidden overflow-y-auto flex-1"
    ></div>
  </div>
  <PanelExample @load-example="loadExample" />
  <PanelSyntax />
  <PanelQa />
  <PanelSnOptions v-model:options="snOptions" />
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
  SNTemplate,
  SNOptions,
  SNChordType,
  SNScoreType,
} from '../../lib';
import { shallowRef, type Ref } from 'vue';
import PanelEditor from './components/PanelEditor.vue';
import PanelSyntax from './components/PanelSyntax.vue';
import PanelExample, { Example } from './components/PanelExample.vue';
import PanelRoadmap from './components/PanelRoadmap.vue';
import PanelOperate from './components/PanelOperate.vue';
import PanelQa from './components/PanelQa.vue';
import Header from './components/Header.vue';
import PanelSnOptions from './components/PanelSnOptions.vue';
import NoteContextMenu from './components/NoteContextMenu.vue';
import PanelInstrument from './components/instrument/PanelInstrument.vue';
import { useEditorStore, useGuitarStore, usePianoStore } from './stores';
import { usePlayer } from './use/usePlayer';
import { parseMidi } from 'midi-file';

const panelOperateRef: Ref<InstanceType<typeof PanelOperate> | null> =
  ref(null);

const sn = shallowRef<SimpleNotation | null>(null);
const container = ref<HTMLDivElement | null>(null);
const formData = ref<SNTemplate>({
  info: {
    title: '小星星',
    composer: 'Mozart, W.A.',
    lyricist: '佚名',
    time: '4',
    tempo: '88',
    key: 'C',
    beat: '4',
  },
  score: `1,1,5,5|6,6,5,-|4,4,3,3
2,2,1,-|5,5,4,4|3,3,2,-
5,5,4,4|3,3,2,-|1,1,5,5
6,6,5,-|4,4,3,3|2,2,1,-`,
  lyric: `一闪一闪亮晶晶-
满天都是小星星-
挂在天空放光明-
好像千颗小眼睛-
一闪一闪亮晶晶-
满天都是小星星`,
});

const snOptions = ref<Partial<SNOptions>>({
  resize: true,
  debug: true,
  score: {
    chordType: SNChordType.Default,
    // scoreType: SNScoreType.Guitar,
  },
});

const inputType = ref<SNDataType>(SNDataType.TEMPLATE);
const abcStr = ref(`X: 1
T: Cooley's
M: 4/4
L: 1/8
Q: 1/4 = 80
K: Emin
|:D2|"Em"EBBA B2 EB|~B2 AB dBAG|
|"D"FDAD BDAD|FDAD dAFD|"Em"EBBA B2 EB|
|B2 AB defg|"D"afe^c dBAF|"Em"DEFD E2:|||
|:gf|"Em"eB B2 efge|eB B2 gedB|
|"D"A2 FA DAFA|A2 FA defg|
|"Em"eB B2 eBgB|eB B2 defg|
|"D"afe^c dBAF|"Em"DEFD E2:|`);

const pianoStore = usePianoStore();
const guardStore = useGuitarStore();
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
      abcStr.value = abcText;
      inputType.value = SNDataType.ABC;
    } else {
      // 模板类型
      const path = `/score/template/【Simple-Notation】${example.name}.json`;
      const response = await fetch(path);
      const exampleData = await response.json();
      formData.value = exampleData;
      inputType.value = SNDataType.TEMPLATE;
      if (example.hasConf) {
        const response = await fetch(path.replace('.json', '.conf.json'));
        const exampleConf = await response.json();
        // 使用扩展运算符融合当前配置和示例配置
        snOptions.value = { ...snOptions.value, ...exampleConf };
      } else {
        // 重置 snOptions 为默认值
        snOptions.value = {
          resize: true,
          debug: false,
          score: {
            chordType: SNChordType.Default,
          },
        };
      }
    }
  } catch (error) {
    console.error('加载示例失败:', error);
  }
};

watch(
  formData,
  () => {
    if (inputType.value === SNDataType.TEMPLATE) {
      sn.value?.loadData(formData.value);
    }
  },
  { deep: true },
);

// 监听 snOptions 变化并更新 SN 实例
watch(
  snOptions,
  (newOptions) => {
    console.log('SN Options Updated:', newOptions);
    // updateOptions 接受 Partial<SNOptions>，所以直接传递 newOptions 是安全的
    sn.value?.updateOptions(newOptions as SNOptions);
  },
  { deep: true },
);

watch(inputType, () => {
  stop();
  if (inputType.value === SNDataType.ABC) {
    sn.value?.loadData(abcStr.value, SNDataType.ABC);
  } else {
    sn.value?.loadData(formData.value);
  }
});

watch(abcStr, () => {
  if (inputType.value === SNDataType.ABC) {
    sn.value?.loadData(abcStr.value, SNDataType.ABC);
  }
});

const { setEditorSelection } = useEditorStore();

const initSn = (container: HTMLDivElement) => {
  // 初始化 SN 时传入当前 snOptions 的值
  sn.value = new SimpleNotation(container, snOptions.value as SNOptions);
  sn.value?.on('note:click', (event) => {
    const note = event.detail.note;
    const [start, end] = note.getTextRange();
    if (start !== undefined && end !== undefined) {
      setEditorSelection(start, end);
    }
  });
  // 添加右键点击监听
  sn.value?.on('note:contextmenu', (event) => {
    const note = event.detail.note;
    isContextMenuVisible.value = true;
    contextMenuX.value = event.detail.e.pageX + 20;
    contextMenuY.value = event.detail.e.pageY + 10;
    contextMenuNoteData.value = note;
  });
  sn.value?.loadData(formData.value);
};

onMounted(() => {
  if (!container.value) {
    throw new Error('Container DOM element not found');
  }
  initSn(container.value);
  window.addEventListener('click', hideContextMenuOnOutsideClick);
});

onBeforeUnmount(() => {
  sn.value?.destroy();
  window.removeEventListener('click', hideContextMenuOnOutsideClick);
});

const isContextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuNoteData = ref(null);
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
  if (inputType.value === SNDataType.ABC) {
    dataStr = abcStr.value;
    ext = 'txt';
  } else {
    dataStr = JSON.stringify(formData.value, null, 2);
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

/**
 * 处理导入文件事件
 * @param {File} file - 导入的文件对象
 * @param {string | ArrayBuffer | any | null} data - 读取到的文件内容 (字符串, ArrayBuffer, 或解析后的对象)
 * @param {string} type - 文件的MIME类型
 */
function handleImportFile(
  file: File,
  data: string | ArrayBuffer | any | null,
  type: string,
) {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.json')) {
    const parsedData = JSON.parse(data);
    formData.value = parsedData;
    inputType.value = SNDataType.TEMPLATE;
  } else if (fileName.endsWith('.txt')) {
    abcStr.value = data;
    inputType.value = SNDataType.ABC;
  } else if (fileName.endsWith('.mid') || fileName.endsWith('.midi')) {
    // 处理 MIDI 文件
    if (data instanceof ArrayBuffer) {
      try {
        const midi = parseMidi(new Uint8Array(data));
        const snTemplateData: SNTemplate = convertMidiToSnTemplate(midi);
        formData.value = snTemplateData;
        inputType.value = SNDataType.TEMPLATE;
      } catch (error) {
        console.error('Error parsing MIDI file:', error);
        // Handle parsing errors
      }
    } else {
      console.error(
        'Expected ArrayBuffer data for MIDI file, but received',
        typeof data,
      );
      // Handle unexpected data type
    }
  } else {
    // 处理其他不支持的文件类型
    console.warn('Unsupported file type imported:', file.name, 'Type:', type);
  }
}

/**
 * 将解析后的 MIDI 数据转换为 SimpleNotation 模板格式 (SNTemplate).
 * TODO: 实现具体的转换逻辑
 * @param {any} midiData - 解析后的 MIDI 数据对象 (来自 midi-file 库)
 * @returns {SNTemplate} 转换后的 SimpleNotation 模板数据
 */
function convertMidiToSnTemplate(midiData: any): SNTemplate {
  console.warn(
    'convertMidiToSnTemplate function is a placeholder. Implement MIDI to SNTemplate conversion here.',
    midiData,
  );
  // TODO: 在此处实现从 midiData 中提取乐谱信息并构建 SNTemplate 对象的逻辑
  // 示例: 返回一个默认的空模板或包含部分信息的模板
  return {
    info: {
      title: midiData.header.name || 'Imported MIDI',
      composer: '',
      lyricist: '',
      time: '4', // 需要从 MIDI 事件中解析
      tempo: '120', // 需要从 MIDI 事件中解析
      key: 'C', // 需要从 MIDI 事件中解析
      beat: '4', // 需要从 MIDI 事件中解析
    },
    score: '', // 需要从 MIDI 音符事件中生成简谱字符串
    lyric: '', // 需要从 MIDI 歌词事件中生成歌词字符串
  };
}
</script>
