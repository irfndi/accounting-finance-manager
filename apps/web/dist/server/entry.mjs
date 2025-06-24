import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CZI3maJx.mjs';
import { manifest } from './manifest_C9kCAdfE.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/ai-analysis.astro.mjs');
const _page2 = () => import('./pages/api/ai-insights.astro.mjs');
const _page3 = () => import('./pages/chart-of-accounts.astro.mjs');
const _page4 = () => import('./pages/financial-statements.astro.mjs');
const _page5 = () => import('./pages/general-ledger.astro.mjs');
const _page6 = () => import('./pages/reports.astro.mjs');
const _page7 = () => import('./pages/search.astro.mjs');
const _page8 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["../../node_modules/.pnpm/astro@5.10.0_@types+node@22.15.32_jiti@2.4.2_lightningcss@1.30.1_rollup@4.44.0_typescript@5.8.3_yaml@2.8.0/node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/api/ai-analysis.ts", _page1],
    ["src/pages/api/ai-insights.ts", _page2],
    ["src/pages/chart-of-accounts.astro", _page3],
    ["src/pages/financial-statements.astro", _page4],
    ["src/pages/general-ledger.astro", _page5],
    ["src/pages/reports.astro", _page6],
    ["src/pages/search.astro", _page7],
    ["src/pages/index.astro", _page8]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///Users/irfandi/Coding/2025/finance-manager/apps/web/dist/client/",
    "server": "file:///Users/irfandi/Coding/2025/finance-manager/apps/web/dist/server/",
    "host": true,
    "port": 3000,
    "assets": "_astro"
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
