import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'index.mjs',
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        '@strudel/core',
        '@strudel/superdough'
      ],
    },
  },
});
