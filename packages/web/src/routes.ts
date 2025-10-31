import { type RouteRecordRaw } from 'vue-router';
import Home from './pages/Home.vue';
import PianoRoll from './pages/PianoRoll.vue';
import LayoutTest from './pages/LayoutTest.vue';

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Home },
  { path: '/piano-roll', name: 'PianoRoll', component: PianoRoll },
  { path: '/layout-test', name: 'LayoutTest', component: LayoutTest },
];
