import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  // --- THIS IS THE FIX ---
  // This server section correctly proxies API requests during local development.
  // It tells Vite: "When you see a request to '/api', forward it to the backend."
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Your local Django backend
        changeOrigin: true,
      },
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  plugins: [react()],
})