import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'SN',
      fileName: 'simple-notation',
      formats: ['es', 'umd'],
    },
  },
  test: {
    environment: 'jsdom',
  },
  plugins: [dts({ rollupTypes: true, tsconfigPath: './tsconfig.json' })],
  resolve: {
    alias: [
      {
        find: '@components',
        replacement: path.resolve(__dirname, 'src/components'),
      },
      {
        find: '@config',
        replacement: path.resolve(__dirname, 'src/config'),
      },
      {
        find: '@core',
        replacement: path.resolve(__dirname, 'src/core'),
      },
      {
        find: '@layers',
        replacement: path.resolve(__dirname, 'src/layers'),
      },
      {
        find: '@types',
        replacement: path.resolve(__dirname, 'src/types'),
      },
      {
        find: '@utils',
        replacement: path.resolve(__dirname, 'src/utils'),
      },
    ],
  },
});
