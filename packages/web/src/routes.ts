import { type RouteRecordRaw } from 'vue-router';
import Home from './pages/Home.vue';
import pianoRoll from './pages/pianoRoll.vue';

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Home },
  { path: '/piano-roll', name: 'pianoRoll', component: pianoRoll },
];
