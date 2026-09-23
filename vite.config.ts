import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const { VITE_GATEWAY_TARGET = 'http://127.0.0.1:18080' } = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 18000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: VITE_GATEWAY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/admin'),
        },
      },
    },
    preview: {
      port: 18000,
      host: '0.0.0.0',
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
    },
  }
})
