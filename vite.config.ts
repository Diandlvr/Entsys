import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite para el renderer (React).
// base: './' porque Electron carga el index.html con file://, no desde un servidor.
export default defineConfig({
  root: 'src/renderer',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
