import { type RouteRecordRaw } from 'vue-router';
import Home from './pages/Home.vue';
import PianoWindow from './pages/PianoWindow.vue';

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Home },
  { path: '/piano-window', name: 'PianoWindow', component: PianoWindow },
];
