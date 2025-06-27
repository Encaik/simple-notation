<template>
  <Card class="max-w-[1200px] w-full mt-5 mx-auto">
    <template #title>
      <span class="font-bold">ℹ️ 关于简音创作</span>
    </template>

    <!-- Header Section -->
    <div class="text-center mb-8">
      <h2
        class="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#8a5cf6] to-[#ec4899]"
      >
        简音创作 - 你的智能乐谱伙伴
      </h2>
      <p class="text-xl text-gray-600 font-semibold">「灵感迸发？三秒成谱！」</p>
    </div>

    <!-- Main Features Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <!-- Feature Card: 一键成谱 -->
      <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="font-bold text-lg mb-2">🎼 一键成谱，创作零门槛</h3>
        <ul class="list-disc pl-5 space-y-1 text-gray-700 text-sm">
          <li>输入文本，秒转专业乐谱，支持简谱与六线谱。</li>
          <li>和弦显示、谱面宽高、边距等细节随心定制。</li>
        </ul>
      </div>

      <!-- Feature Card: 听见创作 -->
      <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="font-bold text-lg mb-2">🎹 听见创作，看见演奏</h3>
        <ul class="list-disc pl-5 space-y-1 text-gray-700 text-sm">
          <li>沉浸式播放，同步显示动态乐器面板（钢琴/吉他/口琴）。</li>
          <li>音色自由切换，面板智能联动，探索完美音色。</li>
          <li>支持移调、分轨播放与变速，是排练学习的得力助手。</li>
        </ul>
      </div>

      <!-- Feature Card: 高效创作 -->
      <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="font-bold text-lg mb-2">🛠️ 高效创作工坊</h3>
        <ul class="list-disc pl-5 space-y-1 text-gray-700 text-sm">
          <li>流畅在线编辑器，轻松编辑音符、休止符、连音线等。</li>
          <li>导入MIDI/MP3辅助创作，手动扒谱或改编效率更高。</li>
          <li>音高检测+K歌模式，实时反馈，视唱练耳趣味十足。</li>
        </ul>
      </div>

      <!-- Feature Card: 乐谱库 -->
      <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="font-bold text-lg mb-2">📚 精选乐谱库</h3>
        <p class="text-gray-700 text-sm">
          内置精选实用乐谱（经典片段、练习曲等），点击即可编辑、播放、学习。
        </p>
      </div>

      <!-- Feature Card: 自由输出 -->
      <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="font-bold text-lg mb-2">📥 自由流转，轻松输出</h3>
        <ul class="list-disc pl-5 space-y-1 text-gray-700 text-sm">
          <li>支持乐谱导入/导出，无缝衔接工作流。</li>
          <li>一键高清打印，随时分享纸质乐谱。</li>
        </ul>
      </div>
    </div>

    <!-- Target Audience Section -->
    <div class="mb-8">
      <h3 class="text-center font-bold text-xl mb-4">✨ 为热爱音乐的你而生</h3>
      <div class="flex flex-wrap justify-center gap-4 text-center">
        <div class="p-3 bg-purple-100 text-purple-800 rounded-lg min-w-[120px]">
          <h4 class="font-semibold">创作者</h4>
          <p class="text-xs">快速捕捉灵感</p>
        </div>
        <div class="p-3 bg-green-100 text-green-800 rounded-lg min-w-[120px]">
          <h4 class="font-semibold">学习者</h4>
          <p class="text-xs">三位一体突破瓶颈</p>
        </div>
        <div class="p-3 bg-blue-100 text-blue-800 rounded-lg min-w-[120px]">
          <h4 class="font-semibold">教师</h4>
          <p class="text-xs">便捷生成教学素材</p>
        </div>
        <div class="p-3 bg-yellow-100 text-yellow-800 rounded-lg min-w-[120px]">
          <h4 class="font-semibold">爱好者</h4>
          <p class="text-xs">轻松玩转音乐</p>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="text-center mt-6">
      <span
        class="inline-block bg-gradient-to-r from-[#ff6b3d] to-[#7b5aff] text-white px-6 py-3 rounded-full font-semibold shadow-lg text-lg"
      >
        🚀 立即免费体验，用更聪明的方式玩音乐！
      </span>
    </div>
  </Card>
</template>
