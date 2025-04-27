# 简谱渲染

## 介绍

这是一个基于 TypeScript 开发的动态简谱渲染库，用户仅需文本输入，即可在网页上生成优美的简谱。

示例:[https://simple-notation.vercel.app/](https://simple-notation.vercel.app/)

## 使用方法

```javascript
const sn = new SimpleNotation(container, {
  debug: true,
});

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

![渲染结果](/doc/img/preview.png)

## 名字解释

- simple notation : 简谱
- score : 整个乐谱
- stave : 一行乐谱，可包含多个小节
- measure : 小节

更具体的可以参考此链接：[音乐术语中音对照](https://www.cnblogs.com/Stareven233/p/15755596.html)
