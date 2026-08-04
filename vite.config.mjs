import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        'program-book': resolve(import.meta.dirname, 'Program Book.html'),
      },
    },
  },
});
