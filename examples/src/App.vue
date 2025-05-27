<template>
  <Header />
  <PanelOperate
    ref="panelOperateRef"
    @import-file="handleImportFile"
    @export-file="handleExportFile"
  />
  <PanelPiano />
  <div
    class="max-w-[1200px] mt-5 mx-auto w-full h-auto max-h-[800px] flex min-h-[70vh] gap-5 flex-row max-[1200px]:flex-col max-[1200px]:w-auto max-[1200px]:max-h-max max-[1200px]:overflow-x-auto"
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
      class="bg-white min-w-[730px] bg-opacity-95 rounded-lg shadow-md relative backdrop-blur-sm overflow-x-hidden overflow-y-auto flex-1"
    ></div>
  </div>
  <PanelExample @load-example="loadExample" />
  <PanelSnOptions v-model:options="snOptions" />
  <PanelRoadmap />
  <PanelSyntax />
  <PanelQa />
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
} from '../../lib';
import { shallowRef, type Ref } from 'vue';
import PanelEditor from './components/PanelEditor.vue';
import PanelSyntax from './components/PanelSyntax.vue';
import PanelExample, { Example } from './components/PanelExample.vue';
import PanelRoadmap from './components/PanelRoadmap.vue';
import PanelOperate from './components/PanelOperate.vue';
import PanelQa from './components/PanelQa.vue';
import Header from './components/Header.vue';
import PanelPiano from './components/PanelPiano.vue';
import PanelSnOptions from './components/PanelSnOptions.vue';
import NoteContextMenu from './components/NoteContextMenu.vue';

const panelOperateRef: Ref<InstanceType<typeof PanelOperate> | null> =
  ref(null);

const isDebug = ref(false);
const isResize = ref(true);
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

// 定义响应式 SN 配置，使用 Partial 允许部分属性存在
const snOptions = ref<Partial<SNOptions>>({
  resize: isResize.value,
  debug: isDebug.value,
  score: {
    // 确保 score 对象存在并包含 chordType 的默认值
    chordType: 'default',
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

/**
 * 加载示例的方法，支持模板和abc类型
 * @param {Example} example - 示例文件
 */
const loadExample = async (example: Example) => {
  if (panelOperateRef.value && panelOperateRef.value.stop) {
    panelOperateRef.value.stop();
    console.log('Stopped playback.');
  }
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
          resize: isResize.value,
          debug: isDebug.value,
          score: {
            chordType: 'default',
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
  if (panelOperateRef.value && panelOperateRef.value.stop) {
    panelOperateRef.value.stop();
    console.log('Stopped playback.');
  }
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

const initSn = (container: HTMLDivElement) => {
  // 初始化 SN 时传入当前 snOptions 的值
  sn.value = new SimpleNotation(container, snOptions.value as SNOptions);
  sn.value?.on('note:click', (event) => {
    const note = event.detail.note;
    const [start, end] = note.getTextRange();

    if (start !== undefined && end !== undefined) {
      // 获取编辑器元素
      const editor = document.getElementById(
        inputType.value === SNDataType.ABC ? 'abc-input' : 'score-input',
      ) as HTMLTextAreaElement;
      if (editor) {
        // 设置选中范围
        editor.focus();
        editor.setSelectionRange(start, end);
      }
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
 * 处理导入乐谱文件
 * @param {File} file - 导入的文件对象
 * @param {string} content - 文件内容
 * @returns {void}
 */
function handleImportFile(file: File, content: string) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  try {
    if (ext === 'json') {
      const json = JSON.parse(content);
      if (typeof json === 'string') {
        inputType.value = SNDataType.ABC;
        abcStr.value = json;
      } else {
        inputType.value = SNDataType.TEMPLATE;
        formData.value = json;
      }
    } else if (ext === 'txt') {
      inputType.value = SNDataType.ABC;
      abcStr.value = content;
    } else {
      alert('仅支持json或txt格式');
    }
  } catch (err) {
    alert('文件解析失败，请检查格式');
  }
}
</script>
