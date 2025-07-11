import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { fileURLToPath } from 'url';

export default defineConfig({
  integrations: [react()],
  output: 'server',
  devToolbar: {
    enabled: false
  },
  env: {
    schema: {
      JWT_SECRET: envField.string({ context: 'server', access: 'secret' })
    }
  },
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
        // Use local src paths instead of non-existent packages
        '@/types': fileURLToPath(new URL('./src/types', import.meta.url)),
        '@/db': fileURLToPath(new URL('./src/db', import.meta.url)),
        '@/lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
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