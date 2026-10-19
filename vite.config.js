import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    // En desarrollo, el cliente corre en Vite (:3000) y el servidor de juego
    // autoritativo puede correr aparte (:3001) con `npm run dev:server`.
    // El WebSocket se proxya para que el cliente siempre use el mismo path.
    proxy: {
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
