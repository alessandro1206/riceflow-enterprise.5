import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // Raises the limit to 1MB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Splits large libraries into a separate "vendor" chunk
            return 'vendor';
          }
        },
      },
    },
  },
});
