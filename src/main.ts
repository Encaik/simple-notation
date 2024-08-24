import { SimpleNotation } from '../lib/main';

const app = document.querySelector<HTMLDivElement>('#app');
const container = document.createElement('div');
container.id = 'container';
container.setAttribute('style', 'display: flex;');
app?.appendChild(container);

const sn = new SimpleNotation(container, {
  debug: true,
});

window.addEventListener('resize', () => {
  sn.resize(container.clientWidth, container.clientHeight);
});

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
  score: `
    -,-,-,0/16,1/16,4/16,5/16|
    5/16,6/16,6/16,6/16,6/16,6/8,6/16,6/16,5/16,5/16,5/16,5/16,5/8,5/16|
    5/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,1/16,1/16,0/16,1/16,4/16,5/16|
    5/16,6/16,6/16,6/16,6/16,6/16,6/16,1/16+,0/16,6/16,6/16,6/16,6/16,6/16,5/16,4/16|
    5/8.,6/16,6,-,0/8,5/16,6/16|
    5/8.,4/16,4,-,0/8,5/16,6/16|
    5/8.,4/16,4,-,-||`,
  lyric: `----咕噜咕噜咕咕噜咕-噜咕咕噜咕噜-咕咕噜咕噜咕-咕噜咕噜咕咕-噜咕噜咕咕噜咕噜咕噜咕-噜咕咕噜咕噜咕噜咕噜--咕咕噜咕噜--咕噜咕咕噜`,
});
