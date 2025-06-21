import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import './styles/index.css';
import { inject } from '@vercel/analytics';
import { Card, Button, Table, Modal } from './widgets';
import { createRouter, createWebHashHistory } from 'vue-router';
import { routes } from './routes';

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);
app
  .component('Card', Card)
  .component('Button', Button)
  .component('Table', Table)
  .component('Modal', Modal);
app.mount('#app');
inject();
