import { createApp } from 'vue';
// @ts-expect-error vue
import App from './App.vue';

const app = createApp(App);
app.mount('#app');
