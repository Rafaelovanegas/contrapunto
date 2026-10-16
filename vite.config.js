import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Puerto local propio de la app (regla del Arquitecto): 5274.
export default defineConfig({
  plugins: [react()],
  server: { port: 5274 },
  preview: { port: 5274 },
});
