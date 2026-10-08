import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // During development, /api calls go to the Express server...
      '/api': 'http://localhost:4000',
      // ...and the 2D/3D editor (engine example app) runs on its own Vite server.
      '/editor': { target: 'http://localhost:3000', ws: true }
    }
  },
  // `npm run build` puts the editor in dist/editor, so preview only forwards the API.
  preview: {
    port: 4173,
    proxy: { '/api': 'http://localhost:4000' }
  }
})
