import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const backend = process.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    allowedHosts: ['.localhost'],
    proxy: {
      // changeOrigin: false preserva o Host original — é ele que identifica o tenant.
      '/api': { target: backend, changeOrigin: false },
    },
  },
  worker: {
    format: 'es',
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://demo.localhost:5173' },
    },
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
