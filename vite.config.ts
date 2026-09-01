import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_PROXY_TARGET || 'http://localhost:8000'
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': { target: backendTarget, changeOrigin: true },
        '/health': { target: backendTarget, changeOrigin: true },
      },
    },
  }
})