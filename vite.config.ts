import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  // This new 'server' section is the fix.
  server: {
    // THIS PROXY SECTION SHOULD BE REMOVED FOR CLARITY
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