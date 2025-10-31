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

// ABC 测试数据
const abcData = `%%abc-2.1
%%encoding utf-8
X:1
T:测试乐曲
C:测试作者
M:4/4
L:1/4
K:C
V:1 name="Melody" clef=treble
[K:C] C4 D4 E4 F4 | G4 A4 B4 c4 | c4 B4 A4 G4 | F4 E4 D4 C4 :|
w:这 是 测 试 | 歌 词 对 齐 | 测 试 功 能 | 正 常 运 行 |
w:* 多 行 * | * 歌 词 * | * 测 试 * | * 功 能 * |

V:2 name="Harmony" clef=treble
[K:G] |: G4 D4 | E4 D4 | G4 E4 | D4 G4 | E4 D4 | z8 :|`;

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
