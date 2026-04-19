import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  /**
   * По умолчанию — публичный API (как в исходном проекте): фронт в dev работает без локального бэкенда.
   * Локальный бэкенд: в .env.local задайте VITE_PROXY_TARGET=http://127.0.0.1:3000 и запустите backend.
   */
  const proxyTarget = env.VITE_PROXY_TARGET || 'https://platform.oyustudio.kz'

  return {
    plugins: [
      vue(),
      {
        name: 'log-api-proxy',
        configureServer() {
          if (mode === 'development') {
            console.info(
              `[vite] Proxy /api -> ${proxyTarget} (локальный API: VITE_PROXY_TARGET=http://127.0.0.1:3000)`
            )
          }
        },
      },
    ],
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.spec.js', 'src/**/*.test.js'],
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: proxyTarget.startsWith('https'),
        },
      },
    },
  }
})
