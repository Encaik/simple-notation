import { fileURLToPath, URL } from 'node:url';
import path from 'path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // 添加 simple-notation 的路径别名，以便在 web 项目中能正确解析 simple-notation 源码中的导入
      '@data': path.resolve(__dirname, '../simple-notation/src/data'),
      '@data/*': path.resolve(__dirname, '../simple-notation/src/data/*'),
      '@layout': path.resolve(__dirname, '../simple-notation/src/layout'),
      '@layout/*': path.resolve(__dirname, '../simple-notation/src/layout/*'),
      '@manager': path.resolve(__dirname, '../simple-notation/src/manager'),
      '@manager/*': path.resolve(__dirname, '../simple-notation/src/manager/*'),
      '@render': path.resolve(__dirname, '../simple-notation/src/render'),
      '@render/*': path.resolve(__dirname, '../simple-notation/src/render/*'),
      '@core': path.resolve(__dirname, '../simple-notation/src/core'),
      '@core/*': path.resolve(__dirname, '../simple-notation/src/core/*'),
      '@components': path.resolve(__dirname, '../simple-notation/src/components'),
      '@config': path.resolve(__dirname, '../simple-notation/src/config'),
      '@layers': path.resolve(__dirname, '../simple-notation/src/layers'),
      '@types': path.resolve(__dirname, '../simple-notation/src/types'),
      '@utils': path.resolve(__dirname, '../simple-notation/src/utils'),
    },
  },
});
