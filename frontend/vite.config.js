import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the browser talks only to :5173; Vite forwards API and socket traffic to the backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
});
