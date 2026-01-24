import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { builtinModules } from 'module';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    clearMocks: true,
    exclude: [
      '**/tests/electron/**',
      '**/node_modules/**',
      '**/dist/**'
    ]
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    rollupOptions: {
      external: ['electron', builtinModules],
      output: {
        globals: {
          electron: 'electron'
        }
      }
    }
  }
});
