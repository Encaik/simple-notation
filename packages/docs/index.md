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
    title: 一键成谱
    details: |
      - 文本秒转乐谱，创作零门槛
      - 支持简谱/六线谱，随心定制
  - icon: 🎹
    title: 沉浸式演奏
    details: |
      - 动态乐器面板，音色联动
      - 分轨、变速、移调，精准控制
  - icon: 🛠️
    title: 智能编辑
    details: |
      - 流畅编辑音符、连音线等
      - 支持MIDI/MP3导入，音高检测
  - icon: 📚
    title: 乐谱库
    details: |
      - 内置精选乐谱，点击即用
      - 一键编辑、播放、学习
  - icon: 📥
    title: 输出无忧
    details: |
      - 导入导出，协作无缝
      - 高清打印，随时分享
---

<style>
/* audience-section 区块整体渐变背景和居中 */
.audience-section {
  max-width: 100vw;
  margin: 48px 0 0 0;
  padding: 48px 0 56px 0;
  text-align: center;
}
.audience-section h2 {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 32px;
  letter-spacing: 1px;
}
.audience-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 28px;
  margin-top: 0;
}
.audience-card {
  background: #fff;
  border: 2px solid #7b5aff;
  border-radius: 18px;
  padding: 28px 18px 22px 18px;
  min-width: 200px;
  max-width: 240px;
  flex: 1 1 200px;
  box-shadow: 0 2px 12px 0 rgba(123,90,255,0.08);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  position: relative;
  overflow: hidden;
}
.audience-card:hover {
  transform: translateY(-8px) scale(1.04);
  box-shadow: 0 8px 32px 0 rgba(255,107,61,0.18);
  border-color: #ff6b3d;
}
.audience-card .icon {
  font-size: 2.2rem;
  margin-bottom: 10px;
  display: block;
}
.audience-card h4 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #7b5aff;
}
.audience-card p {
  font-size: 1rem;
  margin: 0;
  color: #444;
  letter-spacing: 0.2px;
}
@media (max-width: 900px) {
  .audience-grid { flex-direction: column; align-items: center; }
  .audience-card { max-width: 320px; min-width: 0; }
}
</style>

<!-- audience-section 用于突出目标用户，采用渐变背景和主题色卡片 -->
<div class="audience-section">
  <h2>✨ 为热爱音乐的你而生</h2>
  <div class="audience-grid">
    <div class="audience-card">
      <span class="icon">💡</span>
      <h4>创作者</h4>
      <p>灵感速记，乐谱即刻成型。</p>
    </div>
    <div class="audience-card">
      <span class="icon">📖</span>
      <h4>学习者</h4>
      <p>看谱、听音、学指法，三合一突破瓶颈。</p>
    </div>
    <div class="audience-card">
      <span class="icon">👩‍🏫</span>
      <h4>教师</h4>
      <p>高效生成教学素材，直观演示技法。</p>
    </div>
    <div class="audience-card">
      <span class="icon">🎤</span>
      <h4>爱好者</h4>
      <p>K歌练唱，玩转乐谱，探索音乐乐趣！</p>
    </div>
  </div>
</div>
