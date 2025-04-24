# Simple Notation 使用指南

Simple Notation 是一个轻量级的简谱渲染库，可以将文本格式的简谱数据转换为可视化的网页简谱展示。本指南将帮助您快速上手使用这个库。

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [基本概念](#基本概念)
- [API参考](#api参考)
- [示例](#示例)

## 安装

使用 npm 安装:

```bash
npm install simple-notation
```

或使用 yarn:

```bash
yarn add simple-notation
```

## 快速开始

1. 首先在你的项目中引入 Simple Notation：

```javascript
import { SimpleNotation } from 'simple-notation';
```

2. 创建一个容器元素：

```html
<div id="container"></div>
```

3. 初始化 Simple Notation 实例：

```javascript
const container = document.getElementById('container');
const sn = new SimpleNotation(container, {
  debug: false, // 可选，开启调试模式
});
```

4. 加载简谱数据：

```javascript
sn.loadData({
  info: {
    title: '歌曲名称',
    composer: '作曲',
    lyricist: '作词',
    time: '4', // 拍号分子
    tempo: '120', // 速度
    key: 'C', // 调号
    beat: '4', // 拍号分母
  },
  score: `
    -,-,-,0/16,1/16,4/16,5/16|
    5/16,6/16,6/16,6/16,6/16,6/8,6/16,6/16|
  `,
  lyric: '咕噜咕噜咕咕噜咕噜',
});
```

## 基本概念

### 简谱格式说明

- 音符格式：`音高/时值`
  - 音高：1-7 表示音阶，0 表示休止符
  - 时值：2、4、8、16 等表示几分音符
- 小节线：使用 `|` 分隔
- 休止符：使用 `-` 表示
- 连音线：使用 `+` 连接两个音符

### 配置选项

初始化时可以传入以下配置选项：

```javascript
{
  debug: boolean, // 是否开启调试模式
  // 更多配置项待补充
}
```

## API参考

### SimpleNotation 类

#### 构造函数

```typescript
constructor(container: HTMLElement, options?: SimpleNotationOptions)
```

#### 方法

1. `loadData(data: NotationData): void`

   - 加载简谱数据
   - 参数：
     - data: 包含 info、score 和 lyric 的对象

2. `resize(width: number, height: number): void`
   - 调整渲染区域大小
   - 参数：
     - width: 宽度
     - height: 高度

### 数据类型

```typescript
interface NotationData {
  info: {
    title: string; // 曲名
    composer: string; // 作曲
    lyricist: string; // 作词
    time: string; // 拍号分子
    tempo: string; // 速度
    key: string; // 调号
    beat: string; // 拍号分母
  };
  score: string; // 简谱内容
  lyric: string; // 歌词
}
```

## 示例

### 基本示例

```javascript
const sn = new SimpleNotation(container);

sn.loadData({
  info: {
    title: '未闻花名',
    composer: '佚名',
    lyricist: '佚名',
    time: '4',
    tempo: '120',
    key: 'C',
    beat: '4',
  },
  score: `-,-,-,0/16,1/16,4/16,5/16|5/16,6/16,6/16,6/16,6/16,6/8,6/16,6/16|`,
  lyric: '咕噜咕噜咕咕噜咕噜',
});
```

### 响应式调整

```javascript
window.addEventListener('resize', () => {
  sn.resize(container.clientWidth, container.clientHeight);
});
```

## 注意事项

1. 确保容器元素具有合适的尺寸
2. 简谱数据中的小节线要正确对应拍号
3. 歌词长度应与音符数量匹配

## 常见问题

1. Q: 为什么简谱没有显示？
   A: 检查容器元素是否具有有效的尺寸，以及简谱数据格式是否正确。

2. Q: 如何调整简谱大小？
   A: 使用 resize 方法调整渲染区域大小，简谱会自动适应。

## 更新日志

请参考项目根目录的 [CHANGELOG.md](../CHANGELOG.md) 文件。
