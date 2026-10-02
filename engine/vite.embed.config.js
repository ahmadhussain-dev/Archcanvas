// Builds the example editor for ArchCanvas, served by the web app at /editor/.
// Dev:   npm run dev:editor   (web's Vite server forwards /editor to it)
// Build: npm run build:editor (writes into web/dist/editor)
import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config.js';

export default defineConfig((env) => mergeConfig(baseConfig(env), {
  base: '/editor/',
  server: { port: 3000, strictPort: true }
}));
