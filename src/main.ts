import { SimpleNotation } from '../lib/main';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="container" width="500" height="800"></div>
`;

const notation = new SimpleNotation(
  document.querySelector<HTMLDivElement>('#container')!,
  {},
);
