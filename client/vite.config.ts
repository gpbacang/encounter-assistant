import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Read the API port the same way the server does: server/.env, overridden by the shell.
  const { PORT } = loadEnv(mode, fileURLToPath(new URL('../server', import.meta.url)), '')
  return {
    plugins: [react()],
    server: {
      // Proxy the API so the client can call /api/* directly.
      proxy: { '/api': `http://localhost:${PORT || 8787}` },
    },
  }
})
