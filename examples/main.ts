import { SimpleNotation } from '../lib';

// 获取DOM元素
const container = document.querySelector<HTMLDivElement>('#container');
const scoreInput = document.querySelector<HTMLTextAreaElement>('#score-input');
const lyricInput = document.querySelector<HTMLTextAreaElement>('#lyric-input');

// 获取info输入元素
const titleInput = document.querySelector<HTMLInputElement>('#title-input');
const composerInput =
  document.querySelector<HTMLInputElement>('#composer-input');
const lyricistInput =
  document.querySelector<HTMLInputElement>('#lyricist-input');
const timeInput = document.querySelector<HTMLInputElement>('#time-input');
const tempoInput = document.querySelector<HTMLInputElement>('#tempo-input');
const keyInput = document.querySelector<HTMLInputElement>('#key-input');
const beatInput = document.querySelector<HTMLInputElement>('#beat-input');

if (
  !container ||
  !scoreInput ||
  !lyricInput ||
  !titleInput ||
  !composerInput ||
  !lyricistInput ||
  !timeInput ||
  !tempoInput ||
  !keyInput ||
  !beatInput
) {
  throw new Error('Required DOM elements not found');
}

// 初始化简谱实例
const sn = new SimpleNotation(container, {
  debug: true,
});

// 更新尺寸函数
function updateSize() {
  if (container) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    sn.resize(width, height);
  }
}

// 监听窗口大小变化
window.addEventListener('resize', updateSize);

// 默认数据
const defaultData = {
  info: {
    title: '未闻花名',
    composer: '佚名',
    lyricist: '佚名',
    time: '4',
    tempo: '120',
    key: 'C',
    beat: '4',
  },
  score: `-,-,-,0/16,1/16,4/16,5/16|
5/16,6/16,6/16,6/16,6/16,6/8,6/16,6/16,5/16,5/16,5/16,5/16,5/8,5/16|
5/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,1/16,1/16,0/16,1/16,4/16,5/16|
5/16,6/16,6/16,6/16,6/16,6/16,6/16,1/16+,0/16,6/16,6/16,6/16,6/16,6/16,5/16,4/16|
5/8.,6/16,6,-,0/8,5/16,6/16|
5/8.,4/16,4,-,0/8,5/16,6/16|
5/8.,4/16,4,-,-||`,
  lyric: `----咕噜咕噜咕咕噜咕-噜咕咕噜咕噜-咕咕噜咕噜咕-咕噜咕噜咕咕-噜咕噜咕咕噜咕噜咕噜咕-噜咕咕噜咕噜咕噜咕噜--咕咕噜咕噜--咕噜咕咕噜`,
};

// 设置默认值
scoreInput.value = defaultData.score;
lyricInput.value = defaultData.lyric;
titleInput.value = defaultData.info.title;
composerInput.value = defaultData.info.composer;
lyricistInput.value = defaultData.info.lyricist;
timeInput.value = defaultData.info.time;
tempoInput.value = defaultData.info.tempo;
keyInput.value = defaultData.info.key;
beatInput.value = defaultData.info.beat;

// 初始化加载数据
sn.loadData(defaultData);

/**
 * 更新预览内容
 * 从输入框获取最新的内容并更新预览
 */
function updatePreview() {
  const data = {
    info: {
      title: titleInput?.value.trim() || '',
      composer: composerInput?.value.trim() || '',
      lyricist: lyricistInput?.value.trim() || '',
      time: timeInput?.value.trim() || '',
      tempo: tempoInput?.value.trim() || '',
      key: keyInput?.value.trim() || '',
      beat: beatInput?.value.trim() || '',
    },
    score: scoreInput?.value.trim() || '',
    // 处理歌词中的换行和多余空格
    lyric:
      (lyricInput?.value || '')
        .split('\n')
        .map((line) => line.trim())
        .join('')
        .trim() || '',
  };

  sn.loadData(data);
}

// 添加输入事件监听
const inputs = [
  scoreInput,
  lyricInput,
  titleInput,
  composerInput,
  lyricistInput,
  timeInput,
  tempoInput,
  keyInput,
  beatInput,
];

inputs.forEach((input) => {
  input.addEventListener('input', updatePreview);
});

// 初始化尺寸
updateSize();
