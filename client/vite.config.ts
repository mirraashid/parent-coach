import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API runs separately; Vite proxies /api to it so the
// browser only ever talks to one origin (same as production).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
