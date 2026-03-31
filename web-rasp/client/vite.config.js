import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/yandex-api': {
        target: 'https://api.rasp.yandex-net.ru',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/yandex-api/, '/v3.0'),
      },
    },
  },
})