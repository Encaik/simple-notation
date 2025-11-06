<template>
  <div class="layout-test-page">
    <div class="header">
      <h1>Simple Notation - 布局树渲染测试</h1>
      <p>此页面用于测试新的布局树构建和渲染功能</p>
    </div>
    <div id="container" ref="container" class="container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { SimpleNotation } from '../../../simple-notation/src/sn';
import { SNDataType } from '../../../simple-notation/src/data/model/input';

defineOptions({
  name: 'LayoutTest',
});

const container = ref<HTMLDivElement | null>(null);
let sn: SimpleNotation | null = null;

const abcData: string = `
T:小星星
T:Twinkle Twinkle Little Star
C:Traditional
M:4/4
L:1/4
Q:1/4=100
K:C major
S:1
V:1 name="Melody" clef=treble
[K:C] |: C C G G | A A G2 | F F E E | D D C2 |
w:一 闪 一 闪 | 亮 晶 晶 | 满 天 都 是 | 小 星 星 |
G G F F | E E D2 | G G F F | E E D2 :|
w:挂 在 天 空 | 放 光 明 | 好 像 许 多 | 小 眼 睛 |
`;

onMounted(() => {
  if (!container.value) {
    console.error('Container element not found');
    return;
  }

  try {
    // 创建 SimpleNotation 实例
    sn = new SimpleNotation(container.value, {
      // 可以传入配置，这里使用默认配置
      // layout: { ... },
      // score: { ... },
      // renderer: SNRendererType.SVG,
    });

    // 加载数据（会自动解析、构建布局树、渲染）
    sn.loadData(abcData, SNDataType.ABC);
  } catch (error) {
    console.error('Failed to initialize SimpleNotation:', error);
  }
});

onBeforeUnmount(() => {
  // 清理 SimpleNotation 实例
  if (sn) {
    sn.destroy();
    sn = null;
  }
});
</script>

<style scoped>
.layout-test-page {
  min-height: 100vh;
  padding: 20px;
  background: #f5f5f5;
}

.header {
  margin-bottom: 20px;
  text-align: center;
}

.header h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.container {
  width: 100%;
  height: 800px;
  border: 2px solid #333;
  background: white;
  overflow: auto;
  margin-bottom: 20px;
  border-radius: 4px;
}
</style>
