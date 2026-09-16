import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    proxy: {
      // Forward all backend API paths to the backend server.
      // This avoids the browser's CORS block because both origin and
      // destination are now localhost:5173 from the browser's perspective.
      // The Vite dev server performs the actual forwarding server-side.
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/workspaces': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/knowledge-bases': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})

