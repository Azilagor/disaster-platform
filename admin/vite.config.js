import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://platform.oyustudio.kz',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
