<template>
  <div class="header">
    <h1>Simple Notation</h1>
    <p>优雅的简谱创作与展示工具，让音乐创作更简单🎼</p>
  </div>
</template>

<style scoped>
.header {
  text-align: center;
  margin-bottom: 2rem;
  flex-shrink: 0;
  padding: 2rem 0;
}
.header h1 {
  margin: 0;
  font-size: 3.2rem;
  display: inline-block;
  background: linear-gradient(135deg, #ff6b3d, #7b5aff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.15);
  font-weight: 800;
  letter-spacing: 2px;
  position: relative;
  padding-bottom: 15px;
}
.header h1::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #ff6b3d, #7b5aff);
  border-radius: 2px;
}
.header p {
  color: #666;
  margin: 1.5rem 0 0;
  font-size: 1.2rem;
  font-weight: 500;
}
</style>
