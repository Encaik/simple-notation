<template>
  <Header />
  <PanelOperate />
  <div class="app">
    <PanelEditor v-model:formData="formData" v-model:isDebug="isDebug" />
    <div id="container" ref="container" class="preview-panel"></div>
  </div>
  <PanelExample @load-example="loadExample" />
  <PanelSyntax />
  <PanelQa />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { SimpleNotation } from '../../lib';
import PanelEditor from './components/PanelEditor.vue';
import PanelSyntax from './components/PanelSyntax.vue';
import PanelExample from './components/PanelExample.vue';
import PanelOperate from './components/PanelOperate.vue';
import PanelQa from './components/PanelQa.vue';
import Header from './components/Header.vue';

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

// 加载示例的方法
const loadExample = async (examplePath: string) => {
  try {
    const response = await fetch(examplePath);
    const exampleData = await response.json();
    formData.value = exampleData;
  } catch (error) {
    console.error('加载示例失败:', error);
  }
};

const isDebug = ref(false);

let sn: SimpleNotation | null = null;

watch(
  formData,
  () => {
    sn?.loadData(formData.value);
  },
  { deep: true },
);

watch(isDebug, () => {
  sn?.updateOptions({ debug: isDebug.value });
});

const initSn = (container: HTMLDivElement) => {
  sn = new SimpleNotation(container, {
    debug: isDebug.value,
  });
  sn?.loadData(formData.value);
};

const updateSize = () => {
  if (container.value && sn) {
    const width = container.value.clientWidth - 40;
    const height = container.value.clientHeight - 40;
    sn.resize(width, height);
  }
};

onMounted(() => {
  if (!container.value) {
    throw new Error('Container DOM element not found');
  }
  initSn(container.value);
  updateSize();
  window.addEventListener('resize', updateSize);
  return () => {
    window.removeEventListener('resize', updateSize);
  };
});
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 20px auto 0;
  width: 100%;
  flex: 1;
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
  padding: 20px;
  border-radius: 8px;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08);
  position: relative;
  backdrop-filter: blur(10px);
  overflow: auto;
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
