import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_DH8vzf6d.mjs';
import { manifest } from './manifest_Bb1NEYzZ.mjs';

const serverIslandMap = new Map();;

const pageMap = new Map([
    
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
