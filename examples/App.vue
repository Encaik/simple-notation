<template>
  <div class="header">
    <h1>Simple Notation</h1>
    <p>优雅的简谱创作与展示工具，让音乐创作更简单</p>
  </div>
  <div class="app">
    <div class="editor-panel">
      <div class="info-grid">
        <h3 class="section-title">基本信息</h3>
        <div class="input-group">
          <label for="title-input">标题</label>
          <input
            type="text"
            id="title-input"
            v-model="formData.info.title"
            placeholder="请输入标题..."
          />
        </div>
        <div class="input-group">
          <label for="composer-input">作曲</label>
          <input
            type="text"
            id="composer-input"
            v-model="formData.info.composer"
            placeholder="请输入作曲..."
          />
        </div>
        <div class="input-group">
          <label for="lyricist-input">作词</label>
          <input
            type="text"
            id="lyricist-input"
            v-model="formData.info.lyricist"
            placeholder="请输入作词..."
          />
        </div>
        <div class="input-group">
          <label for="time-input">拍号</label>
          <input
            type="text"
            id="time-input"
            v-model="formData.info.time"
            placeholder="请输入拍号..."
          />
        </div>
        <div class="input-group">
          <label for="tempo-input">速度</label>
          <input
            type="text"
            id="tempo-input"
            v-model="formData.info.tempo"
            placeholder="请输入速度..."
          />
        </div>
        <div class="input-group">
          <label for="key-input">调号</label>
          <input
            type="text"
            id="key-input"
            v-model="formData.info.key"
            placeholder="请输入调号..."
          />
        </div>
        <div class="input-group">
          <label for="beat-input">节拍</label>
          <input
            type="text"
            id="beat-input"
            v-model="formData.info.beat"
            placeholder="请输入节拍..."
          />
        </div>
        <div class="input-group">
          <label for="debug-mode">Debug 模式</label>
          <select id="debug-mode" v-model="isDebug">
            <option :value="false">关闭</option>
            <option :value="true">开启</option>
          </select>
        </div>
      </div>
      <div class="score-lyric-container">
        <div class="input-group">
          <label for="score-input">简谱：</label>
          <textarea
            id="score-input"
            v-model="formData.score"
            placeholder="请输入简谱内容..."
          ></textarea>
        </div>
        <div class="input-group">
          <label for="lyric-input">歌词：</label>
          <textarea
            id="lyric-input"
            v-model="formData.lyric"
            placeholder="请输入歌词内容..."
          ></textarea>
        </div>
      </div>
    </div>
    <div id="container" ref="container" class="preview-panel"></div>
  </div>
  <div class="syntax-panel">
    <h3 style="color: #333; font-size: 1.5rem; margin-bottom: 1rem">
      简谱和歌词编写语法
    </h3>
    <div
      style="
        background-color: #f9f9f9;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
      "
    >
      <h4 style="color: #555; font-size: 1.2rem; margin-bottom: 0.5rem">
        简谱编写教程
      </h4>
      <p>
        简谱主要由音符、时值、连音线、小节线和休止符等元素组成。以下是详细规则：
      </p>
      <ul style="list-style-type: disc; padding-left: 1.5rem">
        <li><strong>音符</strong>：使用 `1-7` 表示音阶，`0` 表示休止符。</li>
        <li>
          <strong>时值</strong>：通过 `/` 后跟数字来表示音符的时值，如 `/2`
          表示二分音符，`/8` 表示八分音符。若不指定时值，默认时值为四分音符。
        </li>
        <li>
          <strong>小节线</strong>：使用 `|`
          分隔不同的小节，当换行时不需要加小节线默认换行处为一小节。
        </li>
        <li><strong>延长音</strong>：使用 `-` 表示。</li>
      </ul>
      <p>示例：</p>
      <pre
        style="
          background-color: #fff;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        "
      ><code>1,1,5,5|6,6,5,-|4,4,3,3
2,2,1,-|5,5,4,4|3,3,2,-</code></pre>
    </div>
    <div style="background-color: #f9f9f9; padding: 1rem; border-radius: 4px">
      <h4 style="color: #555; font-size: 1.2rem; margin-bottom: 0.5rem">
        歌词编写教程
      </h4>
      <p>
        歌词可以包含多行，每行对应简谱中的一个乐句。歌词中的换行和多余空格会被处理，因此可以自由排版。
      </p>
      <p>歌词中`-`代表跳过当前的音符</p>
      <p>示例：</p>
      <pre
        style="
          background-color: #fff;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        "
      ><code>一闪一闪亮晶晶-
满天都是小星星-</code></pre>
    </div>
  </div>
  <div class="qa-panel">
    <h3>常见问题</h3>
    <div class="qa-item">
      <h4>Q: 为什么采用换行的方式来确定一句的内容，而不是自动计算？</h4>
      <p>
        A:
        换行的方式可以更清晰地展示歌词和简谱的对应关系，且目前处于初期阶段，计算方式比较容易影响功能实现，在基本功能完善后可以考虑添加自动计算。
      </p>
    </div>
    <!-- 可以根据需要添加更多 Q&A 项 -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { SimpleNotation } from '../lib';

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
.header {
  text-align: center;
  margin-bottom: 2rem;
  flex-shrink: 0;
  padding: 2rem 0;
}
.header h1 {
  margin: 0;
  font-size: 3.2rem;
  display: inline-block;
  background: linear-gradient(135deg, #ff6b3d, #7b5aff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.15);
  font-weight: 800;
  letter-spacing: 2px;
  position: relative;
  padding-bottom: 15px;
}
.header h1::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #ff6b3d, #7b5aff);
  border-radius: 2px;
}
.header p {
  color: #666;
  margin: 1.5rem 0 0;
  font-size: 1.2rem;
  font-weight: 500;
}
.app {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  flex: 1;
  display: flex;
  min-height: 70vh;
  gap: 20px;
  flex-direction: row;
}
.syntax-panel,
.qa-panel {
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
.editor-panel {
  flex: 1;
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
  backdrop-filter: blur(10px);
}
.preview-panel {
  flex: 1;
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
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.input-group label {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}
.input-group textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  flex: 1;
  min-height: 0;
  background: rgba(255, 255, 255, 0.8);
}
.input-group input,
.input-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
}
.input-group input:focus,
.input-group textarea:focus,
.input-group select:focus {
  outline: none;
  border-color: #ff6b3d;
  box-shadow: 0 0 0 2px rgba(255, 107, 61, 0.1);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 24px;
  flex-shrink: 0;
}
.info-grid .input-group {
  min-width: 0;
}
.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 12px 0;
  grid-column: 1 / -1;
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
.score-lyric-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
}
.score-lyric-container .input-group {
  flex: 1;
  min-height: 0;
  display: flex;
}
</style>
