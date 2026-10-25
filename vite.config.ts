import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Keep the browser's Host header so the API knows which address she opened (localhost vs Wi-Fi IP)
      '/api': { target: 'http://localhost:8787', changeOrigin: false, xfwd: true },
    },
  },
});
