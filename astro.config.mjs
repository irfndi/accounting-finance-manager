import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { fileURLToPath } from 'url';

export default defineConfig({
  integrations: [react()],
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      configPath: './wrangler.jsonc',
    }
  }),
  srcDir: './src/web',
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // Fix MessageChannel error for React 19 + Cloudflare Workers
        ...(process.env.NODE_ENV === 'production' && {
          "react-dom/server": "react-dom/server.edge",
        }),
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
    port: 3000,
    host: true
  }
});