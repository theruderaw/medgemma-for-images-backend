import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/documents': 'http://localhost:3000',
      '/status':    'http://localhost:3000',
      '/rag':       'http://localhost:3000',
      '/health':    'http://localhost:3000',
    },
  },
})
