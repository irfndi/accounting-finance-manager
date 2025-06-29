import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_B8uYS7ZH.mjs';
import { manifest } from './manifest_BBG83j8g.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/ai-analysis.astro.mjs');
const _page2 = () => import('./pages/api/ai-analysis.astro2.mjs');
const _page3 = () => import('./pages/api/ai-insights.astro.mjs');
const _page4 = () => import('./pages/api/ai-insights.astro2.mjs');
const _page5 = () => import('./pages/chart-of-accounts.astro.mjs');
const _page6 = () => import('./pages/financial-statements.astro.mjs');
const _page7 = () => import('./pages/general-ledger.astro.mjs');
const _page8 = () => import('./pages/reports.astro.mjs');
const _page9 = () => import('./pages/search.astro.mjs');
const _page10 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/.pnpm/astro@5.10.1_@types+node@24.0.4_aws4fetch@1.0.20_jiti@2.4.2_lightningcss@1.30.1_rollup@_2f8d7c323dcfb30734ead8638f44c77f/node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/web/pages/api/ai-analysis.js", _page1],
    ["src/web/pages/api/ai-analysis.ts", _page2],
    ["src/web/pages/api/ai-insights.js", _page3],
    ["src/web/pages/api/ai-insights.ts", _page4],
    ["src/web/pages/chart-of-accounts.astro", _page5],
    ["src/web/pages/financial-statements.astro", _page6],
    ["src/web/pages/general-ledger.astro", _page7],
    ["src/web/pages/reports.astro", _page8],
    ["src/web/pages/search.astro", _page9],
    ["src/web/pages/index.astro", _page10]
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
    "client": "file:///Users/irfandi/Coding/2025/finance-manager/dist/client/",
    "server": "file:///Users/irfandi/Coding/2025/finance-manager/dist/server/",
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
