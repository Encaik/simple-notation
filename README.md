![banner](https://socialify.git.ci/Encaik/simple-notation/image?description=1&font=Jost&forks=1&issues=1&language=1&name=1&owner=1&pattern=Diagonal+Stripes&stargazers=1&theme=Light)

# 简谱渲染

## 介绍

这是一个基于 TypeScript 开发的动态简谱渲染库，用户仅需文本输入，即可在网页上生成优美的简谱。

简谱应用:[https://simple-notation.vercel.app/](https://simple-notation.vercel.app/)

[![vercel deploy](https://vercelbadge.vercel.app/api/encaik/simple-notation)](https://simple-notation.vercel.app/)

## 使用方法

[![npm version](https://badge.fury.io/js/simple-notation.svg)](https://badge.fury.io/js/simple-notation)

### 1. 引入方式

#### 浏览器直接引入

1. ESM方式

将 `dist/simple-notation.js` 和 `dist/style.css` 拷贝到你的项目，并在 HTML 中引入：

```html
<body>
  <div id="container"></div>
  <script type="module">
    import { SimpleNotation } from './simple-notation.js';
    import './style.css';
    const container = document.getElementById('container');
    const sn = new SimpleNotation(app, {
      resize: true,
      debug: true,
    });
    sn.loadData(...);
  </script>
</body>
```

2. UMD方式

将 `dist/simple-notation.umd.js` 和 `dist/style.css` 拷贝到你的项目，并在 HTML 中引入：

```html
<head>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <div id="container"></div>
  <script src="./simple-notation.umd.js"></script>
  <script>
    const container = document.getElementById('container');
    const sn = new SN.SimpleNotation(container, {

    })
    sn.loadData(...);
  </script>
</body>
```

#### npm 包引入

```bash
npm install simple-notation
```

1. ESM方式

```js
import { SimpleNotation } from 'simple-notation';
import 'simple-notation/dist/style.css';

const container = document.getElementById('container');
const sn = new SimpleNotation(container, { debug: true });
sn.loadData(...);
```

2. UMD方式

```js
const SN = require('simple-notation');
import'simple-notation/dist/style.css';
const container = document.getElementById('container');
const sn = new SN.SimpleNotation(container, { debug: true });
sn.loadData(...);
```

### 2. 加载数据

```js
sn.loadData({
  info: {
    title: '小星星',
    composer: 'Mozart, W.A.',
    lyricist: '佚名',
    time: '4',
    tempo: '88',
    key: 'C',
    beat: '4',
  },
  score: `1,1,5,5|6,6,5,-|4,4,3,3
2,2,1,-|5,5,4,4|3,3,2,-
5,5,4,4|3,3,2,-|1,1,5,5
6,6,5,-|4,4,3,3|2,2,1,-`,
  lyric: `一闪一闪亮晶晶-
满天都是小星星-
挂在天空放光明-
好像千颗小眼睛-
一闪一闪亮晶晶-
满天都是小星星`,
});
```

### 3. 播放控制

`simple-notation` 提供了独立的播放器类 `SNPlayer`，可用于简谱的自动播放、暂停、继续、停止等操作，并支持光标联动。

```js
import { SNPlayer } from 'simple-notation';

// 需在 sn.loadData 后创建播放器实例
const player = new SNPlayer();

// 播放
player.play();

// 暂停
player.pause();

// 继续
player.resume();

// 停止
player.stop();

// 播放结束回调
player.onEnd(() => {
  console.log('播放结束');
});

// 实际发声回调（非'-'音符）
player.onNotePlay((note, duration) => {
  // 可在此处集成 WebAudio 或 MIDI 播放
  console.log('播放音符', note, '时长', duration);
});

// 光标移动回调（每个音符都会触发，包括'-'）
player.onPointerMove((note) => {
  // 可用于自定义高亮
  console.log('光标移动到', note);
});
```

### 4. 光标层控制

播放器会自动联动光标层（高亮当前播放音符）。如需手动控制光标，可使用 `SNPointerLayer`：

```js
import { SNPointerLayer } from 'simple-notation';

// 显示/移动光标到指定音符
SNPointerLayer.showPointer('note-1', sn.el);

// 隐藏光标
SNPointerLayer.clearPointer();
```

> **注：** `note-1` 为 SVG 元素的 `sn-tag` 属性值，通常可通过回调参数中的 `note.tag` 获取。

### 5. 其他说明

- 支持自动响应容器大小变化（`resize: true`）。
- 支持调试模式（`debug: true`），会输出详细日志。
- 支持 ABC 记谱法（开发中）。

如需更详细的 API 说明和高级用法，请参考源码中的 JSDoc 注释和 `examples/` 目录下的实际用例。

## 名字解释

- simple notation : 简谱
- score : 整个乐谱
- stave : 一行乐谱，可包含多个小节
- measure : 小节

更具体的可以参考此链接：[音乐术语中音对照](https://www.cnblogs.com/Stareven233/p/15755596.html)
