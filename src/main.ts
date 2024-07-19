import { SimpleNotation } from '../lib/main';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="container" width="744" height="1052"></div>
`;

const sn = new SimpleNotation(
  document.querySelector<HTMLDivElement>('#container')!,
);
sn.loadData({
  info: {
    title: '未闻花名',
    composer: '佚名',
  },
  score: [
    `-,-,-,0/16,1/16,4/16,5/16|
      5/16,6/16,6/16,6/16,6/16,6/8,6/16,6/16,5/16,5/16,5/16,5/16,5/8,5/16|
      5/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,4/16,1/16,1/16,0/16,1/16,4/16,5/16`,
    `5/16,6/16,6/16,6/16,6/16,6/16,6/16,1/16+,0/16,6/16,6/16,6/16,6/16,6/16,5/16,4/16|
      5/8.,6/16,6,-,0/8,5/16,6/16|5/8.,4/16,4,-,0/8,5/16,6/16|
      5/8.,4/16,4,-,-`,
  ],
});
