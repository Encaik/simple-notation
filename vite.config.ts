import { defineConfig } from 'vite';
import path from 'path';
// @ts-ignore
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: './lib/index.ts',
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
  plugins: [dts({ rollupTypes: true, tsconfigPath: './tsconfig.lib.json' })],
});
