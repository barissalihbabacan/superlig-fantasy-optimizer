import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/superlig-fantasy-optimizer/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './web/src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
