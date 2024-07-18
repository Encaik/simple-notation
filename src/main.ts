import { SimpleNotation } from '../lib/main';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="container" width="744" height="1052"></div>
`;

const notation = new SimpleNotation(
  document.querySelector<HTMLDivElement>('#container')!,
);
