<template>
  <Card class="max-w-[1200px] w-full mt-5 mx-auto overflow-hidden">
    <template v-slot:title> ✍️简谱和歌词编写语法 </template>
    <div class="bg-[#f9f9f9] p-4 rounded-md mb-6">
      <h4 class="text-[#555] text-lg mb-2">简谱编写教程</h4>
      <p>简谱主要由音符、时值、连音线、小节线和休止符等元素组成。以下是详细规则：</p>
      <table class="min-w-full border border-[#ddd] rounded-md divide-y divide-[#ddd]">
        <thead>
          <tr class="bg-[#f0f0f0]">
            <th class="py-3 px-4 text-left text-[#333] font-semibold w-1/5">语法元素</th>
            <th class="py-3 px-4 text-left text-[#333] font-semibold w-2/5">说明</th>
            <th class="py-3 px-4 text-left text-[#333] font-semibold w-2/5">示例</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#eee]">
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">音符</td>
            <td class="py-2 px-4">使用 `1-7` 表示音阶，`0` 表示休止符。</td>
            <td class="py-2 px-4"><code>1 2 3 4 5 6 7 0</code></td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">时值</td>
            <td class="py-2 px-4">
              通过 `/` 后跟数字来表示音符的时值，如 `/2` 表示二分音符，`/8`
              表示八分音符。若不指定时值，默认时值为四分音符。
            </td>
            <td class="py-2 px-4"><code>1/2 2/4 3/8 4/16 5/32</code></td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">附点</td>
            <td class="py-2 px-4">
              使用 `.` 表示附点，附点要加在时值后面，例如 `/2.` 表示附点二分音符，`4/8.`
              表示附点八分音符。
            </td>
            <td class="py-2 px-4"><code>1/2. 2/4. 3/8. 4/16.</code></td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">小节线</td>
            <td class="py-2 px-4">
              使用 `|` 分隔不同的小节，当换行时不需要加小节线默认换行处为一小节。
            </td>
            <td class="py-2 px-4">
              <code>1 2 | 3 4<br />5 6 7 | 1</code>
            </td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">延长音</td>
            <td class="py-2 px-4">使用 `-` 表示。</td>
            <td class="py-2 px-4"><code>1 - - - | 2 - | 3</code></td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">升降号</td>
            <td class="py-2 px-4">
              使用 `#` 表示升号，`b` 表示降号。多个升降号时，会使用重升号和重降号，例如 `##3`
              表示升两个半音的音符 `3`。
            </td>
            <td class="py-2 px-4"><code>#1 b2 ##3 bb4</code></td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">八度升降</td>
            <td class="py-2 px-4">
              使用 `^` 表示升八度，`_` 表示降八度。数字为几就表示升降几个八度，例如 `3^^`
              表示升高两个八度的音符 `3`。
            </td>
            <td class="py-2 px-4"><code>1^ 2_ 3^^ 4__</code></td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">括号</td>
            <td class="py-2 px-4">
              括号一般用于特殊音符组合，在实际使用中可根据具体需求对音符进行分组，常用于前奏间奏等部分的标记。
            </td>
            <td class="py-2 px-4"><code>(3,4) (1,5)</code></td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">连音线</td>
            <td class="py-2 px-4">
              使用方括号 `[` 和 `]` 表示连音线的开始和结束，例如 `[3,4,5]` 表示 `3`、`4`、`5`
              这几个音符用连音线连接。
            </td>
            <td class="py-2 px-4"><code>[3,4,5] [1,2]</code></td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">装饰音</td>
            <td class="py-2 px-4">
              使用尖括号 `<` 和 `>` 表示装饰音，括号内可以包含多个装饰音，用逗号分隔，例如 `<#2,2>3`
              表示 `3` 前面有两个装饰音 `#2` 和 `2`。
            </td>
            <td class="py-2 px-4"><code><#2,2>3 <1>2</code></td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">和弦符号</td>
            <td class="py-2 px-4">
              在音符上方加和弦标记（如 <code>{C}</code>、<code>{Am}</code>
              等），即可在播放该音符时自动触发对应的钢琴和弦音播放。<br />
              支持的和弦符号包括：<br />
              大三和弦：<code>{C}</code>, <code>{D}</code>, <code>{E}</code>, <code>{F}</code>,
              <code>{G}</code>, <code>{A}</code>, <code>{B}</code><br />
              小三和弦：<code>{Cm}</code>, <code>{Dm}</code>, <code>{Em}</code>, <code>{Fm}</code>,
              <code>{Gm}</code>, <code>{Am}</code>, <code>{Bm}</code><br />
              数字和弦（C大调）：<code>{1}</code>, <code>{2}</code>, <code>{3}</code>,
              <code>{4}</code>, <code>{5}</code>, <code>{6}</code>, <code>{7}</code><br />
              如
              <code>{C}1</code>
              表示在音符1上方标记C和弦，播放时会自动弹奏C和弦（C3、E3、G3）。
            </td>
            <td class="py-2 px-4"><code>{C}1 {Am}2 {5}3</code></td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">重复记号</td>
            <td class="py-2 px-4">
              在小节线 `|` 旁边使用 `:` 表示重复。`:` 在小节线左侧（例如
              `|:`）表示重复开始，在右侧（例如 `:|`）表示重复结束。`|:` 和 `:|`
              可以同时使用表示重复一个小节或一段。
            </td>
            <td class="py-2 px-4"><code>|: 1 2 | 3 4 :|</code></td>
          </tr>
        </tbody>
      </table>
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
      <table class="min-w-full border border-[#ddd] rounded-md divide-y divide-[#ddd]">
        <thead>
          <tr class="bg-[#f0f0f0]">
            <th class="py-3 px-4 text-left text-[#333] font-semibold w-1/5">语法元素</th>
            <th class="py-3 px-4 text-left text-[#333] font-semibold w-2/5">说明</th>
            <th class="py-3 px-4 text-left text-[#333] font-semibold w-2/5">示例</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#eee]">
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">跳过音符</td>
            <td class="py-2 px-4">歌词中`-`代表跳过当前的音符，不为其分配歌词。</td>
            <td class="py-2 px-4"><code>歌词-跳过</code></td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">括号</td>
            <td class="py-2 px-4">
              在歌词中使用 `()` 或 `（）`
              将内容包裹起来，这部分内容会被视为一个整体与简谱中的一个音符对应。支持中英文括号。
            </td>
            <td class="py-2 px-4">
              <code>中文（括号） english(brackets)</code>
            </td>
          </tr>
          <tr class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]">
            <td class="py-2 px-4">竖排多行歌词</td>
            <td class="py-2 px-4">
              使用 `[数字.内容]` 格式可以编写竖排的多行歌词。其中 `数字` 表示行号（从1开始），`内容`
              是该行对应的歌词片段。连续的 `[数字.内容]` 块会合并成一个竖排歌词单元。每个 `内容`
              部分会按照单字、英文单词、括号等规则拆分。
            </td>
            <td class="py-2 px-4">
              <code>[1.红][2.黄][3.蓝]<br />[1.你好][2.世界]</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>示例：</p>
      <pre class="bg-white p-2 border border-[#ddd] rounded-md"><code>一闪一闪亮晶晶-
满天都是小星星-</code></pre>
    </div>
  </Card>
</template>
