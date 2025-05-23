<template>
  <Header />
  <PanelOperate
    :sn="sn"
    :name="formData.info.title"
    :tempo="formData.info.tempo"
    :panelPianoRef="panelPianoRef"
  />
  <PanelPiano ref="panelPianoRef" />
  <div class="app">
    <PanelEditor
      v-model:formData="formData"
      v-model:isDebug="isDebug"
      v-model:isResize="isResize"
      v-model:abcStr="abcStr"
      :inputType="inputType"
      @change-type="(val) => (inputType = val)"
    />
    <div id="container" ref="container" class="preview-panel"></div>
  </div>
  <PanelExample @load-example="loadExample" />
  <PanelSyntax />
  <PanelQa />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { SimpleNotation, SNDataType } from '../../lib';
import { shallowRef } from 'vue';
import PanelEditor from './components/PanelEditor.vue';
import PanelSyntax from './components/PanelSyntax.vue';
import PanelExample from './components/PanelExample.vue';
import PanelOperate from './components/PanelOperate.vue';
import PanelQa from './components/PanelQa.vue';
import Header from './components/Header.vue';
import PanelPiano from './components/PanelPiano.vue';

const isDebug = ref(false);
const isResize = ref(true);
const sn = shallowRef<SimpleNotation | null>(null);
const container = ref<HTMLDivElement | null>(null);
const formData = ref({
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

const inputType = ref<SNDataType>(SNDataType.TEMPLATE);
const abcStr = ref(`X: 1
T: Cooley's
M: 4/4
L: 1/8
Q: 1/4 = 80
K: Emin
|:D2|"Em"EBBA B2 EB|~B2 AB dBAG|
|"D"FDAD BDAD|FDAD dAFD|"Em"EBBA B2 EB|
|B2 AB defg|"D"afe^c dBAF|"Em"DEFD E2:|
|:gf|"Em"eB B2 efge|eB B2 gedB|
|"D"A2 FA DAFA|A2 FA defg|
|"Em"eB B2 eBgB|eB B2 defg|
|"D"afe^c dBAF|"Em"DEFD E2:|`);

const panelPianoRef = ref();

/**
 * 加载示例的方法，支持模板和abc类型
 * @param {string} examplePath - 示例文件路径
 * @param {boolean} hasConf - 是否有配置文件
 * @param {SNDataType} type - 数据类型
 */
const loadExample = async (
  examplePath: string,
  hasConf: boolean,
  type?: SNDataType,
) => {
  try {
    // 判断类型，决定加载方式
    if (type === SNDataType.ABC || examplePath.endsWith('.txt')) {
      // abc类型
      const response = await fetch(examplePath);
      const abcText = await response.text();
      abcStr.value = abcText;
      inputType.value = SNDataType.ABC;
    } else {
      // 模板类型
      const response = await fetch(examplePath);
      const exampleData = await response.json();
      formData.value = exampleData;
      inputType.value = SNDataType.TEMPLATE;
      if (hasConf) {
        const response = await fetch(
          examplePath.replace('.json', '.conf.json'),
        );
        const exampleConf = await response.json();
        sn.value?.updateOptions(exampleConf);
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

watch(isDebug, () => {
  sn.value?.updateOptions({ debug: isDebug.value });
});

watch(isResize, () => {
  sn.value?.updateOptions({ resize: isResize.value });
});

watch(inputType, () => {
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
  sn.value = new SimpleNotation(container, {
    resize: isResize.value,
    debug: isDebug.value,
  });
  sn.value?.loadData(formData.value);
};

onMounted(() => {
  if (!container.value) {
    throw new Error('Container DOM element not found');
  }
  initSn(container.value);
});

onBeforeUnmount(() => {
  sn.value?.destroy();
});
</script>

<style scoped>
@media screen and (max-width: 1200px) {
  #app {
    .app {
      flex-direction: column;
      width: auto;
      max-height: fit-content;
    }
  }
}

.app {
  max-width: 1200px;
  margin: 20px auto 0;
  width: 100%;
  height: auto;
  max-height: 800px;
  display: flex;
  min-height: 70vh;
  gap: 20px;
  flex-direction: row;
}
.example-panel,
.syntax-panel,
.qa-panel,
.operate-panel {
  max-width: 1200px;
  width: 100%;
  margin: 20px auto 0;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 8px;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  box-sizing: border-box;
}

.preview-panel {
  flex: 0 0 690px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08);
  position: relative;
  backdrop-filter: blur(10px);
  overflow-x: hidden;
  overflow-y: auto;
}

.preview-panel svg {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  width: calc(100% - 40px);
  height: calc(100% - 40px);
}
</style>
