---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: '简音创作'
  text: '你的智能乐谱伙伴'
  tagline: '「灵感迸发？三秒成谱！」—— 高效易用的在线乐谱平台，让创作、学习与演奏更直观、更生动！'
  actions:
    - theme: brand
      text: 🚀 立即体验
      link: https://www.s-n.xyz/
    - theme: alt
      text: 快速上手
      link: /api-examples

features:
  - icon: 🎼
    title: 一键成谱，创作零门槛
    details: |
      - **文本转乐谱**: 输入文本，秒转专业乐谱，告别复杂操作。
      - **多格式支持**: 自由选择生成简谱、六线谱（吉他/尤克里里）。
      - **随心定制**: 和弦显示、谱面宽高、边距等细节由你掌控。
  - icon: 🎹
    title: 听见创作，看见演奏
    details: |
      - **沉浸式播放**: 同步显示钢琴、吉他、口琴动态面板，直观学习。
      - **音色与面板联动**: 切换音色，乐器面板自动匹配更新。
      - **精准播放控制**: 支持移调、分轨播放与变速，是排练学习的助手。
  - icon: 🛠️
    title: 高效创作工坊
    details: |
      - **流畅在线编辑器**: 轻松编辑音符、休止符、连音线等。
      - **文件导入辅助**: 上传MIDI/MP3作为参考，辅助手动扒谱或改编。
      - **音高检测与K歌**: 开启麦克风实时检测音高，K歌模式带音高反馈。
  - icon: 📚
    title: 精选乐谱库
    details: 内置精选实用乐谱（经典片段、练习曲等），点击即可编辑、播放、学习，助力日常练习与灵感激发。
  - icon: 📥
    title: 自由流转，轻松输出
    details: |
      - **无缝衔接**: 支持乐谱导入/导出，方便协作。
      - **高清打印**: 一键高清打印，随时分享纸质乐谱。
---

<style>
.audience-section {
  max-width: 960px;
  margin: 40px auto;
  text-align: center;
}
.audience-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}
.audience-card {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 16px;
  min-width: 180px;
  flex: 1;
  max-width: 220px;
  transition: border-color 0.25s, background-color 0.25s;
}
.audience-card:hover {
  border-color: var(--vp-c-brand);
}
.audience-card h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--vp-c-brand-dark);
}
.audience-card p {
  font-size: 14px;
  margin: 0;
  color: var(--vp-c-text-2);
}
</style>

<div class="audience-section">
  <h2>✨ 为热爱音乐的你而生</h2>
  <div class="audience-grid">
    <div class="audience-card">
      <h4>创作者</h4>
      <p>快速捕捉灵感，高效编辑试听。</p>
    </div>
    <div class="audience-card">
      <h4>学习者</h4>
      <p>看谱+听音+学指法，三位一体突破瓶颈！</p>
    </div>
    <div class="audience-card">
      <h4>教师</h4>
      <p>便捷生成教学素材，直观演示演奏技法。</p>
    </div>
    <div class="audience-card">
      <h4>爱好者</h4>
      <p>玩转乐谱、K歌练唱，探索音乐乐趣！</p>
    </div>
  </div>
</div>
