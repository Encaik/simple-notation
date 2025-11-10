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

const abcData: string = `X:1
T:ABC 功能综合测试
T:Comprehensive ABC Feature Test
C:测试用例
M:4/4
L:1/4
Q:1/4=100
K:C

% 测试1：不同音高（八度测试）
C, D, E, F, | G, A, B, C | C D E F | G A B c | c' d' e' f' | g'2 z2 |
w:低八 度音 符测 试 | 中央 C开 始上 升 | 继续 上升 到高 音C | 再高 一个 八度 | 高音 区测 试 | 休止 *

% 测试2：不同时值（全音符到十六分音符）
C4 | C2 C2 | C C C C | C/2 C/2 C/2 C/2 C/2 C/2 C/2 C/2 |
w:全音 符 | 二分 音符 | 四分 音符 | 八分 音符 测试

% 测试3：附点音符
C. D C. D | C2. D | C.. D C.. D | z4 |
w:附点 四分 音符 | 附点 二分 | 双附 点测 试 | 休 * * *

% 测试4：变音记号（升降号）
C ^C D _D | E =E F ^F | G _G A =A | B c z2 |
w:自然 音升 音降 音 | 还原 记号 测试 | 更多 变音 符号 | 结束 *

% 测试5：不同拍号 - 切换到3/4拍
[M:3/4] C D E | F G A | B c2 |
w:三四 拍测 试 | 三拍 一小 节 | 结束 *

% 测试6：切换到6/8拍
[M:6/8] C D E F G A | B c c B A G | F2 E2 D2 | C6 |
w:六八 拍一 二三 四五 六 | 反向 回来 测试 | 不同 时值 组合 | 结束 * * * * *

% 测试7：切换回4/4拍，加入连音
[M:4/4] (3CDE (3FGA | B c c B | (3cBA (3GFE | D2 C2 |
w:三连 音测 试 | 正常 音符 继续 | 下行 三连 音 | 结束 *

% 测试8：行内转调 - 转到G大调
[K:G] G A B c | d e ^f g | g ^f e d | c B A G |
w:G大 调开 始 | 升F 自然 出现 | 下行 音阶 测试 | 回到 主音

% 测试9：转回C大调，混合节奏
[K:C] C2 D E | F G2 A | B c3 | C4 |
w:转回 C大 调 | 混合 时值 测试 | 长音 * | 结束 * * *
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
