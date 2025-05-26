<template>
  <div
    class="max-w-[1200px] w-full mt-5 mx-auto bg-white bg-opacity-95 p-5 rounded-lg shadow-md flex flex-col gap-4 overflow-hidden box-border"
  >
    <h3 class="text-[#333] text-2xl mb-4">✍️简谱和歌词编写语法</h3>
    <div class="bg-[#f9f9f9] p-4 rounded-md mb-6">
      <h4 class="text-[#555] text-lg mb-2">简谱编写教程</h4>
      <p>
        简谱主要由音符、时值、连音线、小节线和休止符等元素组成。以下是详细规则：
      </p>
      <ul class="list-disc pl-6">
        <li><strong>音符</strong>：使用 `1-7` 表示音阶，`0` 表示休止符。</li>
        <li>
          <strong>时值</strong>：通过 `/` 后跟数字来表示音符的时值，如 `/2`
          表示二分音符，`/8` 表示八分音符。若不指定时值，默认时值为四分音符。
        </li>
        <li>
          <strong>附点</strong>：使用 `.` 表示附点，例如 `/2.`
          表示附点二分音符。需要注意的是，附点要加在时值后面，例如 `4/8.`
          表示附点八分音符。
        </li>
        <li>
          <strong>小节线</strong>：使用 `|`
          分隔不同的小节，当换行时不需要加小节线默认换行处为一小节。
        </li>
        <li><strong>延长音</strong>：使用 `-` 表示。</li>
        <li>
          <strong>升降号</strong>：使用 `#` 表示升号，`b`
          表示降号。多个升降号时，会使用重升号和重降号，例如 `##3`
          表示升两个半音的音符 `3`。
        </li>
        <li>
          <strong>八度升降</strong>：使用 `^` 表示升八度，`_`
          表示降八度。数字为几就表示升降几个八度，例如 `3^^`
          表示升高两个八度的音符 `3`。
        </li>
        <li>
          <strong>括号</strong
          >：括号一般用于特殊音符组合，在实际使用中可根据具体需求对音符进行分组，例如
          `(3,4)` 表示特定的音符组合，常用于前奏间奏等部分的标记。
        </li>
        <li>
          <strong>连音线</strong>：使用方括号 `[` 和 `]`
          表示连音线的开始和结束，例如 `[3,4,5]` 表示 `3`、`4`、`5`
          这几个音符用连音线连接。
        </li>
        <li>
          <strong>装饰音</strong>：使用尖括号 `<` 和 `>`
          表示装饰音，括号内可以包含多个装饰音，用逗号分隔，例如 `<#2,2>3` 表示
          `3` 前面有两个装饰音 `#2` 和 `2`。
        </li>
        <li>
          <strong>和弦符号</strong>：在音符上方加和弦标记（如
          <code>{C}</code
          >、<code>{Am}</code>、<code>{F}</code>、<code>{1}</code>、<code
            >{5}</code
          >
          等），即可在播放该音符时自动触发对应的钢琴和弦音播放。<br />
          <span class="text-[#888] text-[13px]">支持的和弦符号包括：</span>
          <ul class="list-disc pl-6 mt-1">
            <li>
              大三和弦：<code>{C}</code>、<code>{D}</code>、<code>{E}</code>、<code>{F}</code>、<code>{G}</code>、<code>{A}</code>、<code
                >{B}</code
              >
            </li>
            <li>
              小三和弦：<code>{Cm}</code>、<code>{Dm}</code>、<code>{Em}</code>、<code>{Fm}</code>、<code>{Gm}</code>、<code>{Am}</code>、<code
                >{Bm}</code
              >
            </li>
            <li>
              数字和弦（C大调）：<code>{1}</code>、<code>{2}</code>、<code>{3}</code>、<code>{4}</code>、<code>{5}</code>、<code>{6}</code>、<code
                >{7}</code
              >
            </li>
          </ul>
          <span class="text-[#888] text-[13px]"
            >如
            <code>{C}1</code>
            表示在音符1上方标记C和弦，播放时会自动弹奏C和弦（C3、E3、G3）。</span
          >
        </li>
      </ul>
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
      <p>歌词中`-`代表跳过当前的音符</p>
      <p>示例：</p>
      <pre
        class="bg-white p-2 border border-[#ddd] rounded-md"
      ><code>一闪一闪亮晶晶-
满天都是小星星-</code></pre>
    </div>
  </div>
</template>
