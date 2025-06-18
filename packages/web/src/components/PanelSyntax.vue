<template>
  <Card class="max-w-[1200px] w-full mt-5 mx-auto overflow-hidden">
    <template v-slot:title> ✍️简谱和歌词编写语法 </template>
    <div class="bg-[#f9f9f9] p-4 rounded-md mb-6">
      <h4 class="text-[#555] text-lg mb-2">简谱编写教程</h4>
      <p>简谱主要由音符、时值、连音线、小节线和休止符等元素组成。以下是详细规则：</p>
      <Table :columns="notationColumns" :data="notationData" class="mb-2">
        <template #cell-desc="{ value }">
          <span v-html="value" />
        </template>
        <template #cell-example="{ value }">
          <span v-html="value" />
        </template>
      </Table>
      <p>示例：</p>
      <pre
        class="bg-white p-2 border border-[#ddd] rounded-md"
      ><code>[<#2,2>3/8^^,b5/16_,(6,5)]|6,6,5,-|4,4,3,3
2,2,1,-|5,5,4,4|3,3,2,-</code></pre>
    </div>
    <div class="bg-[#f9f9f9] p-4 rounded-md">
      <h4 class="text-[#555] text-lg mb-2">歌词编写教程</h4>
      <p>
        歌词可以包含多行，每行对应简谱中的一个乐句。歌词中的换行和多余空格会被处理，因此可以自由排版。
      </p>
      <Table :columns="lyricColumns" :data="lyricData" class="mb-2">
        <template #cell-desc="{ value }">
          <span v-html="value" />
        </template>
        <template #cell-example="{ value }">
          <span v-html="value" />
        </template>
      </Table>
      <p>示例：</p>
      <pre class="bg-white p-2 border border-[#ddd] rounded-md"><code>一闪一闪亮晶晶-
满天都是小星星-</code></pre>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { Card, Table } from '@/widgets';

const notationColumns = [
  { title: '语法元素', dataIndex: 'element', thClass: 'w-1/5' },
  { title: '说明', dataIndex: 'desc', thClass: 'w-2/5' },
  { title: '示例', dataIndex: 'example', thClass: 'w-2/5' },
];

const notationData = [
  {
    element: '音符',
    desc: '使用 <code>1-7</code> 表示音阶，<code>0</code> 表示休止符。',
    example: '<code>1 2 3 4 5 6 7 0</code>',
  },
  {
    element: '时值',
    desc: '通过 <code>/</code> 后跟数字来表示音符的时值，如 <code>/2</code> 表示二分音符，<code>/8</code> 表示八分音符。若不指定时值，默认时值为四分音符。',
    example: '<code>1/2 2/4 3/8 4/16 5/32</code>',
  },
  {
    element: '附点',
    desc: '使用 <code>.</code> 表示附点，附点要加在时值后面，例如 <code>/2.</code> 表示附点二分音符，<code>4/8.</code> 表示附点八分音符。',
    example: '<code>1/2. 2/4. 3/8. 4/16.</code>',
  },
  {
    element: '小节线',
    desc: '使用 <code>|</code> 分隔不同的小节，当换行时不需要加小节线默认换行处为一小节。',
    example: '<code>1 2 | 3 4<br />5 6 7 | 1</code>',
  },
  {
    element: '延长音',
    desc: '使用 <code>-</code> 表示。',
    example: '<code>1 - - - | 2 - | 3</code>',
  },
  {
    element: '升降号',
    desc: '使用 <code>#</code> 表示升号，<code>b</code> 表示降号。多个升降号时，会使用重升号和重降号，例如 <code>##3</code> 表示升两个半音的音符 <code>3</code>。',
    example: '<code>#1 b2 ##3 bb4</code>',
  },
  {
    element: '八度升降',
    desc: '使用 <code>^</code> 表示升八度，<code>_</code> 表示降八度。数字为几就表示升降几个八度，例如 <code>3^^</code> 表示升高两个八度的音符 <code>3</code>。',
    example: '<code>1^ 2_ 3^^ 4__</code>',
  },
  {
    element: '括号',
    desc: '括号一般用于特殊音符组合，在实际使用中可根据具体需求对音符进行分组，常用于前奏间奏等部分的标记。',
    example: '<code>(3,4) (1,5)</code>',
  },
  {
    element: '连音线',
    desc: '使用方括号 <code>[</code> 和 <code>]</code> 表示连音线的开始和结束，例如 <code>[3,4,5]</code> 表示 <code>3</code>、<code>4</code>、<code>5</code> 这几个音符用连音线连接。',
    example: '<code>[3,4,5] [1,2]</code>',
  },
  {
    element: '装饰音',
    desc: '使用尖括号 <code><</code> 和 <code>></code> 表示装饰音，括号内可以包含多个装饰音，用逗号分隔，例如 <code><#2,2>3</code> 表示 <code>3</code> 前面有两个装饰音 <code>#2</code> 和 <code>2</code>。',
    example: '<code><#2,2>3 <1>2</code>',
  },
  {
    element: '和弦符号',
    desc: '在音符上方加和弦标记（如 <code>{C}</code>、<code>{Am}</code> 等），即可在播放该音符时自动触发对应的钢琴和弦音播放。<br />支持的和弦符号包括：<br />大三和弦：<code>{C}</code>、<code>{D}</code>、<code>{E}</code>、<code>{F}</code>、<code>{G}</code>、<code>{A}</code>、<code>{B}</code><br />小三和弦：<code>{Cm}</code>、<code>{Dm}</code>、<code>{Em}</code>、<code>{Fm}</code>、<code>{Gm}</code>、<code>{Am}</code>、<code>{Bm}</code><br />数字和弦（C大调）：<code>{1}</code>、<code>{2}</code>、<code>{3}</code>、<code>{4}</code>、<code>{5}</code>、<code>{6}</code>、<code>{7}</code><br />如 <code>{C}1</code> 表示在音符1上方标记C和弦，播放时会自动弹奏C和弦（C3、E3、G3）。',
    example: '<code>{C}1 {Am}2 {5}3</code>',
  },
  {
    element: '重复记号',
    desc: '在小节线 <code>|</code> 旁边使用 <code>:</code> 表示重复。<code>:</code> 在小节线左侧（例如 <code>|:</code>）表示重复开始，在右侧（例如 <code>:|</code>）表示重复结束。<code>|:</code> 和 <code>:|</code> 可以同时使用表示重复一个小节或一段。',
    example: '<code>|: 1 2 | 3 4 :|</code>',
  },
];

const lyricColumns = [
  { title: '语法元素', dataIndex: 'element', thClass: 'w-1/5' },
  { title: '说明', dataIndex: 'desc', thClass: 'w-2/5' },
  { title: '示例', dataIndex: 'example', thClass: 'w-2/5' },
];

const lyricData = [
  {
    element: '跳过音符',
    desc: '歌词中<code>-</code>代表跳过当前的音符，不为其分配歌词。',
    example: '<code>歌词-跳过</code>',
  },
  {
    element: '括号',
    desc: '在歌词中使用 <code>()</code> 或 <code>（）</code> 将内容包裹起来，这部分内容会被视为一个整体与简谱中的一个音符对应。支持中英文括号。',
    example: '<code>中文（括号） english(brackets)</code>',
  },
  {
    element: '竖排多行歌词',
    desc: '使用 <code>[数字.内容]</code> 格式可以编写竖排的多行歌词。其中 <code>数字</code> 表示行号（从1开始），<code>内容</code> 是该行对应的歌词片段。连续的 <code>[数字.内容]</code> 块会合并成一个竖排歌词单元。每个 <code>内容</code> 部分会按照单字、英文单词、括号等规则拆分。',
    example: '<code>[1.红][2.黄][3.蓝]<br />[1.你好][2.世界]</code>',
  },
];
</script>

<style scoped>
:deep(td),
:deep(th) {
  vertical-align: top;
}
:deep(code) {
  background: none;
  color: #c7254e;
  font-size: 95%;
  padding: 0;
}
</style>
