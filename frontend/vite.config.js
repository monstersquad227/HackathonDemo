import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('代理错误:', err.message)
            console.log('提示: 请确保后端服务器正在运行在 http://localhost:8080')
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[代理请求] ${req.method} ${req.url} -> http://localhost:8080${req.url}`)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`[代理响应] ${req.method} ${req.url} -> ${proxyRes.statusCode}`)
          })
        },
      }
    }
  }
})

