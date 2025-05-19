<template>
  <div class="editor-panel">
    <div class="info-grid">
      <h3 class="section-title">基本信息</h3>
      <div class="input-group">
        <label for="title-input">标题</label>
        <input
          type="text"
          id="title-input"
          :value="formData.info.title"
          @input="
            $emit('update:formData', {
              ...formData,
              info: { ...formData.info, title: $event.target?.value },
            })
          "
          placeholder="请输入标题..."
        />
      </div>
      <div class="input-group">
        <label for="composer-input">作曲</label>
        <input
          type="text"
          id="composer-input"
          :value="formData.info.composer"
          @input="
            $emit('update:formData', {
              ...formData,
              info: { ...formData.info, composer: $event.target?.value },
            })
          "
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
        <label for="debug-mode">自适应</label>
        <select
          id="resize"
          :value="isResize"
          @change="$emit('update:isResize', $event.target?.value === 'true')"
        >
          <option :value="false">关闭</option>
          <option :value="true">开启</option>
        </select>
      </div>
      <div class="input-group">
        <label for="debug-mode">Debug 模式</label>
        <select
          id="debug-mode"
          :value="isDebug"
          @change="$emit('update:isDebug', $event.target?.value === 'true')"
        >
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
          :value="formData.score"
          @input="
            $emit('update:formData', {
              ...formData,
              score: $event.target?.value,
            })
          "
          placeholder="请输入简谱内容..."
        ></textarea>
      </div>
      <div class="input-group">
        <label for="lyric-input">歌词：</label>
        <textarea
          id="lyric-input"
          :value="formData.lyric"
          @input="
            $emit('update:formData', {
              ...formData,
              lyric: $event.target?.value,
            })
          "
          placeholder="请输入歌词内容..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  formData: {
    info: {
      title: string;
      composer: string;
      lyricist: string;
      time: string;
      tempo: string;
      key: string;
      beat: string;
    };
    score: string;
    lyric: string;
  };
  isDebug: boolean;
  isResize: boolean;
}>();

const emits = defineEmits([
  'update:formData',
  'update:isDebug',
  'update:isResize',
]);
</script>

<style scoped>
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

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 12px 0;
  grid-column: 1 / -1;
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
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 24px;
  flex-shrink: 0;
}
.info-grid .input-group {
  min-width: 0;
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
