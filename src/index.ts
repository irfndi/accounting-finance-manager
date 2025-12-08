/**
 * Main entry point for Cloudflare Worker.
 * Exposes the full-stack Worker (API + static assets) and the underlying app.
 */
export { default } from './worker/entry';
export { app } from './worker/app';
