import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import './styles/index.css';
import { inject } from '@vercel/analytics';
import { Card, Button, Table } from './widgets';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.component('Card', Card).component('Button', Button).component('Table', Table);
app.mount('#app');
inject();
