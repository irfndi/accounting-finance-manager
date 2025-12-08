import type { ExecutionContext, Request as CfRequest } from '@cloudflare/workers-types';
import type { EnvWithAssets } from './types';
import { app } from './app';

const assetMethods = new Set(['GET', 'HEAD']);

/**
 * Single Worker entrypoint that serves both API routes and static assets.
 * - /api/* and /health are handled by the Hono app
 * - other GET/HEAD requests are served from the Wrangler assets binding
 * - HTML navigations fall back to index.html for SPA routing
 */
export default {
  async fetch(request: Request, env: EnvWithAssets, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const path = url.pathname;

    const isApiRequest =
      path.startsWith('/api') ||
      path === '/health' ||
      path === '/api/health';

    if (isApiRequest) {
      return app.fetch(request, env, ctx);
    }

    if (assetMethods.has(request.method) && env.ASSETS) {
      // Try to serve the exact asset first
      const assetResponse = await env.ASSETS.fetch(request as unknown as CfRequest);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }

      // For SPA-style routes, fall back to index.html
      const acceptsHTML = request.headers
        .get('accept')
        ?.includes('text/html');

      if (acceptsHTML) {
        const indexRequest = new Request(
          new URL('/index.html', url.origin).toString(),
          request,
        );

        const fallbackResponse = await env.ASSETS.fetch(indexRequest as unknown as CfRequest);
        if (fallbackResponse.status !== 404) {
          return fallbackResponse;
        }
      }
    }

    // Fallback to API app for any remaining routes
    return app.fetch(request, env, ctx);
  },
};
