import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import './styles/index.css';
import { inject } from '@vercel/analytics';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.mount('#app');
inject();
