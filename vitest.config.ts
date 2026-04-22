import { defineConfig } from 'vitest/config';
import path from 'node:path';

// No @vitejs/plugin-react here: vitest v2 transforms JSX/TSX via its own
// pipeline and adding the plugin pulls in a competing Vite types resolution
// (vitest ships a pinned Vite copy). Tests today do not need Fast Refresh or
// the React plugin's JSX-runtime injection.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
});
