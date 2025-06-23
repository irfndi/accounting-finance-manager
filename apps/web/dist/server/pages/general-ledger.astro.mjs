import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BkfoCJVl.mjs';
import { $ as $$Layout } from '../chunks/Layout_D0PJoKsS.mjs';
import { C as Card } from '../chunks/card_DeCDkYPE.mjs';
export { renderers } from '../renderers.mjs';

const $$GeneralLedger = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "General Ledger - Corporate Finance Manager", "description": "Chart of accounts and transaction management", "currentPath": "/general-ledger" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-6"> <!-- Page Header --> <div class="flex items-center justify-between"> <div> <h1 class="text-2xl font-bold text-slate-900">
General Ledger
</h1> <p class="text-slate-600 mt-1">
Manage your chart of accounts and view transaction details
</p> </div> <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
Add Account
</button> </div> <!-- Quick Stats --> <div class="grid grid-cols-1 md:grid-cols-4 gap-6"> ${renderComponent($$result2, "Card", Card, { "className": "p-4" }, { "default": ($$result3) => renderTemplate` <div class="flex items-center justify-between"> <div> <p class="text-sm font-medium text-slate-600">
Total Accounts
</p> <p class="text-2xl font-bold text-slate-900">247</p> </div> <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"> <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <title>Accounts</title> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path> </svg> </div> </div> ` })} ${renderComponent($$result2, "Card", Card, { "className": "p-4" }, { "default": ($$result3) => renderTemplate` <div class="flex items-center justify-between"> <div> <p class="text-sm font-medium text-slate-600">
Active Accounts
</p> <p class="text-2xl font-bold text-slate-900">198</p> </div> <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"> <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <title>Active</title> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> </div> </div> ` })} ${renderComponent($$result2, "Card", Card, { "className": "p-4" }, { "default": ($$result3) => renderTemplate` <div class="flex items-center justify-between"> <div> <p class="text-sm font-medium text-slate-600">
This Month Transactions
</p> <p class="text-2xl font-bold text-slate-900">1,247</p> </div> <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center"> <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <title>Transactions</title> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path> </svg> </div> </div> ` })} ${renderComponent($$result2, "Card", Card, { "className": "p-4" }, { "default": ($$result3) => renderTemplate` <div class="flex items-center justify-between"> <div> <p class="text-sm font-medium text-slate-600">
Unbalanced Entries
</p> <p class="text-2xl font-bold text-red-600">3</p> </div> <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"> <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <title>Alerts</title> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path> </svg> </div> </div> ` })} </div> <!-- Chart of Accounts --> ${renderComponent($$result2, "Card", Card, { "className": "p-6" }, { "default": ($$result3) => renderTemplate` <div class="flex items-center justify-between mb-4"> <h2 class="text-lg font-semibold text-slate-900">
Chart of Accounts
</h2> <div class="flex items-center space-x-2"> <input type="text" placeholder="Search accounts..." class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"> <select class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"> <option>All Types</option> <option>Assets</option> <option>Liabilities</option> <option>Equity</option> <option>Revenue</option> <option>Expenses</option> </select> </div> </div> <div class="overflow-x-auto"> <table class="w-full"> <thead> <tr class="border-b border-slate-200"> <th class="text-left py-3 px-4 font-medium text-slate-600">Account Code</th> <th class="text-left py-3 px-4 font-medium text-slate-600">Account Name</th> <th class="text-left py-3 px-4 font-medium text-slate-600">Type</th> <th class="text-right py-3 px-4 font-medium text-slate-600">Balance</th> <th class="text-left py-3 px-4 font-medium text-slate-600">Status</th> <th class="text-right py-3 px-4 font-medium text-slate-600">Actions</th> </tr> </thead> <tbody> <tr class="border-b border-slate-100 hover:bg-slate-50"> <td class="py-3 px-4 font-mono text-sm">1000</td> <td class="py-3 px-4">Cash - Operating Account</td> <td class="py-3 px-4"> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
Asset
</span> </td> <td class="py-3 px-4 text-right font-medium">$247,892.34</td> <td class="py-3 px-4"> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
Active
</span> </td> <td class="py-3 px-4 text-right"> <button class="text-blue-600 hover:text-blue-800 text-sm">View</button> </td> </tr> <tr class="border-b border-slate-100 hover:bg-slate-50"> <td class="py-3 px-4 font-mono text-sm">1100</td> <td class="py-3 px-4">Accounts Receivable</td> <td class="py-3 px-4"> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
Asset
</span> </td> <td class="py-3 px-4 text-right font-medium">$89,234.56</td> <td class="py-3 px-4"> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
Active
</span> </td> <td class="py-3 px-4 text-right"> <button class="text-blue-600 hover:text-blue-800 text-sm">View</button> </td> </tr> <tr class="border-b border-slate-100 hover:bg-slate-50"> <td class="py-3 px-4 font-mono text-sm">2000</td> <td class="py-3 px-4">Accounts Payable</td> <td class="py-3 px-4"> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
Liability
</span> </td> <td class="py-3 px-4 text-right font-medium">$34,567.89</td> <td class="py-3 px-4"> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
Active
</span> </td> <td class="py-3 px-4 text-right"> <button class="text-blue-600 hover:text-blue-800 text-sm">View</button> </td> </tr> </tbody> </table> </div> <div class="mt-4 flex items-center justify-between"> <p class="text-sm text-slate-600">Showing 3 of 247 accounts</p> <div class="flex items-center space-x-2"> <button class="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50">Previous</button> <button class="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-50">Next</button> </div> </div> ` })} </div> ` })}`;
}, "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/general-ledger.astro", void 0);

const $$file = "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/general-ledger.astro";
const $$url = "/general-ledger";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$GeneralLedger,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
