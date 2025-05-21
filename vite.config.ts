import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';
import vue from '@vitejs/plugin-vue';

const COMMON_CONFIG = {
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
      {
        find: '@core',
        replacement: path.resolve(__dirname, './lib/src/core'),
      },
      {
        find: '@layers',
        replacement: path.resolve(__dirname, './lib/src/layers'),
      },
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
};

export default defineConfig(({ command, mode }) => {
  if (command === 'serve' || mode === 'examples') {
    return {
      ...COMMON_CONFIG,
      root: './examples',
      build: {
        outDir: '../dist-examples',
      },
      plugins: [vue()],
    };
  } else {
    return {
      ...COMMON_CONFIG,
      build: {
        lib: {
          entry: './lib/index.ts',
          name: 'SimpleNotation',
          fileName: 'simple-notation',
          formats: ['es', 'umd'],
        },
        rollupOptions: {
          external: ['vue', 'tone'],
          output: {
            // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
            globals: {
              vue: 'Vue',
            },
          },
        },
      },
      plugins: [
        dts({ rollupTypes: true, tsconfigPath: './tsconfig.lib.json' }),
      ],
    };
  }
});
