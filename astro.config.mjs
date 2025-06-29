import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import { fileURLToPath } from 'url';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  adapter: node({
    mode: 'standalone'
  }),
  srcDir: './src/web',
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@finance-manager/types': fileURLToPath(new URL('../../packages/types/src', import.meta.url)),
        '@finance-manager/db': fileURLToPath(new URL('../../packages/db/src', import.meta.url)),
        '@finance-manager/core': fileURLToPath(new URL('../../packages/core/src', import.meta.url)),
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 4321,
    host: true
  }
});