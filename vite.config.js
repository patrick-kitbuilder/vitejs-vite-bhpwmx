// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true, // Ensure source maps are generated
  },
});