import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: './lib/main.ts',
      name: 'SimpleNotation',
      fileName: 'simple-notation',
      formats: ['es', 'umd'],
    },
  },
  resolve: {
    alias: [
      {
        find: '@components',
        replacement: path.resolve(__dirname, './lib/src/components'),
      },
      {
        find: '@config',
        replacement: path.resolve(__dirname, './lib/src/config'),
      },
      { find: '@core', replacement: path.resolve(__dirname, './lib/src/core') },
      {
        find: '@types',
        replacement: path.resolve(__dirname, './lib/src/types'),
      },
      {
        find: '@utils',
        replacement: path.resolve(__dirname, './lib/src/utils'),
      },
    ],
  },
});
