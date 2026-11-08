import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // The API runs on 8787; proxy it so the client can call /api/* directly.
    proxy: { '/api': 'http://localhost:8787' },
  },
})
