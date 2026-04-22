import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import process from 'node:process';

const hermesApiUrl = process.env.VITE_HERMES_API_URL ?? 'http://127.0.0.1:9119';
const hermesChatUrl = process.env.VITE_HERMES_CHAT_URL ?? 'http://127.0.0.1:8642';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: hermesApiUrl,
        changeOrigin: true,
        secure: false,
      },
      // Same-origin bootstrap for window.__HERMES_SESSION_TOKEN__ — the client
      // fetches this path, Vite rewrites it to Hermes's SPA shell `/`, and the
      // token script tag is parsed out client-side. Avoids CORS preflight on
      // the token probe when the dashboard runs on a different port.
      '/__hermes_bootstrap': {
        target: hermesApiUrl,
        changeOrigin: true,
        secure: false,
        rewrite: () => '/',
      },
      // Chat uses Hermes' OpenAI-compatible adapter on port 8642. We proxy
      // through Vite so browser requests stay same-origin — this avoids
      // CORS preflight rejecting our custom X-Hermes-Session-Id header
      // (the adapter's hard-coded Allow-Headers list doesn't include it).
      '/v1': {
        target: hermesChatUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'recharts';
            }
            if (id.includes('lucide-react')) {
              return 'lucide';
            }
            if (
              id.includes('react') ||
              id.includes('scheduler') ||
              id.includes('zustand') ||
              id.includes('@tanstack')
            ) {
              return 'vendor';
            }
          }
          return undefined;
        },
      },
    },
  },
});
