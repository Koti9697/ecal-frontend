import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  // This new 'server' section is the fix.
  server: {
    proxy: {
      // This rule tells Vite to forward any request that starts with '/api'
      // to your backend server running on http://localhost:8000
      '/api': {
        target: 'http://localhost:8000',
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