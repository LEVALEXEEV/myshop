import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      'lottie-web': 'lottie-web/build/player/lottie_light.js',
    },
  },

  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/images': 'http://localhost:8080',
    },
  },

  build: {
    chunkSizeWarningLimit: 1500,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lottie-web') || id.includes('lottie-react')) {
              return 'vendor-lottie';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});

