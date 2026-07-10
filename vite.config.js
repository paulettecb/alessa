import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4321,
    open: true,
    // La API de Notion no acepta llamadas directas desde el navegador (CORS),
    // así que el dev server hace de puente: /notion-api/* → api.notion.com/*
    proxy: {
      '/notion-api': {
        target: 'https://api.notion.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/notion-api/, ''),
      },
    },
  },
})
