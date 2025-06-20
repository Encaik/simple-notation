import { type RouteRecordRaw } from 'vue-router';
import Home from './pages/Home.vue';
import PianoRoll from './pages/PianoRoll.vue';

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Home },
  { path: '/piano-roll', name: 'PianoRoll', component: PianoRoll },
];
