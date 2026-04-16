import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: parseInt(process.env.PORT || '3000'),
    proxy: {
      '/api': {
        target: process.env.VITE_HERMES_API_URL || 'http://127.0.0.1:9119',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_HERMES_API_URL || 'http://127.0.0.1:9119',
        changeOrigin: true,
      },
      '/__hermes_root__': {
        target: process.env.VITE_HERMES_API_URL || 'http://127.0.0.1:9119',
        changeOrigin: true,
        rewrite: (path) => path.replace('/__hermes_root__', '/'),
      },
    },
  },
})
