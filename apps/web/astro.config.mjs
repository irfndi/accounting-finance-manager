// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'hybrid',
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 3000,
    host: true
  }
});