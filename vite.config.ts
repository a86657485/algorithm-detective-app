import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 相对路径：保证 dist 可被局域网静态服务器 / 本地文件方式直接打开
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    // 开发时把 /api 转给后端（npm run dev:server），生产环境由后端同端口托管
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    // 课堂机房环境优先保证首屏加载速度
    target: 'es2019',
    chunkSizeWarningLimit: 1200,
  },
})
