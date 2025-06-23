import { o as decodeKey } from './chunks/astro/server_CuGGrjOH.mjs';
import 'clsx';
import 'cookie';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_y2fXSp3k.mjs';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/irfandi/Coding/2025/finance-manager/apps/web/","cacheDir":"file:///Users/irfandi/Coding/2025/finance-manager/apps/web/node_modules/.astro/","outDir":"file:///Users/irfandi/Coding/2025/finance-manager/apps/web/dist/","srcDir":"file:///Users/irfandi/Coding/2025/finance-manager/apps/web/src/","publicDir":"file:///Users/irfandi/Coding/2025/finance-manager/apps/web/public/","buildClientDir":"file:///Users/irfandi/Coding/2025/finance-manager/apps/web/dist/client/","buildServerDir":"file:///Users/irfandi/Coding/2025/finance-manager/apps/web/dist/server/","adapterName":"@astrojs/node","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"general-ledger/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/general-ledger","isIndex":false,"type":"page","pattern":"^\\/general-ledger\\/?$","segments":[[{"content":"general-ledger","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/general-ledger.astro","pathname":"/general-ledger","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"reports/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/reports","isIndex":false,"type":"page","pattern":"^\\/reports\\/?$","segments":[[{"content":"reports","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/reports.astro","pathname":"/reports","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"search/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/search","isIndex":false,"type":"page","pattern":"^\\/search\\/?$","segments":[[{"content":"search","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/search.astro","pathname":"/search","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"../../node_modules/.pnpm/astro@5.10.0_@types+node@22.15.32_jiti@2.4.2_lightningcss@1.30.1_rollup@4.44.0_typescript@5.8.3_yaml@2.8.0/node_modules/astro/dist/assets/endpoint/node.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/ai-analysis","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/ai-analysis\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"ai-analysis","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/ai-analysis.ts","pathname":"/api/ai-analysis","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/ai-insights","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/ai-insights\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"ai-insights","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/ai-insights.ts","pathname":"/api/ai-insights","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/general-ledger.astro",{"propagation":"none","containsHead":true}],["/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/index.astro",{"propagation":"none","containsHead":true}],["/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/reports.astro",{"propagation":"none","containsHead":true}],["/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/search.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000noop-actions":"_noop-actions.mjs","\u0000@astro-page:src/pages/api/ai-analysis@_@ts":"pages/api/ai-analysis.astro.mjs","\u0000@astro-page:src/pages/api/ai-insights@_@ts":"pages/api/ai-insights.astro.mjs","\u0000@astro-page:src/pages/general-ledger@_@astro":"pages/general-ledger.astro.mjs","\u0000@astro-page:src/pages/reports@_@astro":"pages/reports.astro.mjs","\u0000@astro-page:src/pages/search@_@astro":"pages/search.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:../../node_modules/.pnpm/astro@5.10.0_@types+node@22.15.32_jiti@2.4.2_lightningcss@1.30.1_rollup@4.44.0_typescript@5.8.3_yaml@2.8.0/node_modules/astro/dist/assets/endpoint/node@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_BTkItjH5.mjs","/Users/irfandi/Coding/2025/finance-manager/node_modules/.pnpm/unstorage@1.16.0/node_modules/unstorage/drivers/fs-lite.mjs":"chunks/fs-lite_COtHaKzy.mjs","/Users/irfandi/Coding/2025/finance-manager/node_modules/.pnpm/astro@5.10.0_@types+node@22.15.32_jiti@2.4.2_lightningcss@1.30.1_rollup@4.44.0_typescript@5.8.3_yaml@2.8.0/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_BSfRg0aY.mjs","/Users/irfandi/Coding/2025/finance-manager/apps/web/src/components/DocumentSearch.tsx":"_astro/DocumentSearch.34Y2amH_.js","/Users/irfandi/Coding/2025/finance-manager/apps/web/src/components/FinanceDashboard.tsx":"_astro/FinanceDashboard.NzqscSHr.js","/Users/irfandi/Coding/2025/finance-manager/apps/web/src/components/Navigation.tsx":"_astro/Navigation.yn2KVJ4S.js","@astrojs/react/client.js":"_astro/client.BPIbHqJh.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/general-ledger.CecbPqhr.css","/favicon.svg","/_astro/DocumentSearch.34Y2amH_.js","/_astro/FinanceDashboard.NzqscSHr.js","/_astro/Navigation.yn2KVJ4S.js","/_astro/button.C21pPaAi.js","/_astro/card.DmOhoQ5S.js","/_astro/client.BPIbHqJh.js","/_astro/index.BVOCwoKb.js","/general-ledger/index.html","/reports/index.html","/search/index.html","/index.html"],"buildFormat":"directory","checkOrigin":true,"serverIslandNameMap":[],"key":"0tWVDgFRpNst+xJRx4zUJxbtX9O97Jh7UTRU7Wvv23w=","sessionConfig":{"driver":"fs-lite","options":{"base":"/Users/irfandi/Coding/2025/finance-manager/apps/web/node_modules/.astro/sessions"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/fs-lite_COtHaKzy.mjs');

export { manifest };
