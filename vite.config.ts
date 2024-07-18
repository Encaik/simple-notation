import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './lib/main.ts',
      name: 'SimpleNotation',
      fileName: 'simple-notation',
      formats:['es','umd']
    }
  }
})
