import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.spec.js', 'src/**/*.test.js'],
  },
  server: {
    proxy: {
      // В dev запросы на /api уходят на https://platform.oyustudio.kz/api/ — CORS не возникает
      '/api': {
        target: 'https://platform.oyustudio.kz',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
