import { e as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BkfoCJVl.mjs';
import { $ as $$Layout } from '../chunks/Layout_D0PJoKsS.mjs';
export { renderers } from '../renderers.mjs';

const $$ChartOfAccounts = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Chart of Accounts - Finance Manager" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8"> <div id="chart-of-accounts-root"></div> </main> ` })} ${renderScript($$result, "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/chart-of-accounts.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/chart-of-accounts.astro", void 0);

const $$file = "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/chart-of-accounts.astro";
const $$url = "/chart-of-accounts";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ChartOfAccounts,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
