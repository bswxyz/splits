import { defineConfig } from 'vite';

export default defineConfig({
  base: '/splits/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});
