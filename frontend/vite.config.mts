import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': import.meta.dirname + '/src' },
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
  server: {
    host: '0.0.0.0',
    port: 8443,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
})
