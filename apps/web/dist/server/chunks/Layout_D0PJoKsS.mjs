import { e as createComponent, f as createAstro, h as addAttribute, n as renderHead, k as renderComponent, o as renderSlot, r as renderTemplate } from './astro/server_BkfoCJVl.mjs';
/* empty css                                     */
import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useState } from 'react';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-blue-600 underline-offset-4 hover:underline",
        // Finance-specific variants
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700",
        financial: "bg-emerald-600 text-white hover:bg-emerald-700"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button";
    return /* @__PURE__ */ jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z",
    description: "Overview and key metrics"
  },
  {
    id: "chart-of-accounts",
    label: "Chart of Accounts",
    href: "/chart-of-accounts",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    description: "Manage chart of accounts"
  },
  {
    id: "general-ledger",
    label: "General Ledger",
    href: "/general-ledger",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    description: "Transactions and journal entries"
  },
  {
    id: "financial-reports",
    label: "Financial Reports",
    href: "/reports",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    description: "P&L, Balance Sheet, Cash Flow"
  },
  {
    id: "budget-forecast",
    label: "Budget & Forecast",
    href: "/budget",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    description: "Planning and forecasting tools"
  },
  {
    id: "audit-trail",
    label: "Audit Trail",
    href: "/audit",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    description: "Compliance and audit logs"
  },
  {
    id: "document-search",
    label: "Document Search",
    href: "/search",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    description: "Semantic document search"
  },
  {
    id: "multi-entity",
    label: "Multi-Entity",
    href: "/entities",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    description: "Manage multiple companies"
  }
];
function Navigation({ currentPath = "/" }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return /* @__PURE__ */ jsxs("nav", { className: `bg-slate-900 text-white transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"} min-h-screen fixed left-0 top-0 z-40`, children: [
    /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-slate-700", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      !isCollapsed && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold", children: "Finance Manager" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Corporate Accounting" })
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => setIsCollapsed(!isCollapsed),
          className: "text-slate-400 hover:text-white hover:bg-slate-800",
          children: /* @__PURE__ */ jsxs(
            "svg",
            {
              className: `w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`,
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
              "aria-label": isCollapsed ? "Expand navigation" : "Collapse navigation",
              children: [
                /* @__PURE__ */ jsx("title", { children: isCollapsed ? "Expand navigation" : "Collapse navigation" }),
                /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" })
              ]
            }
          )
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "p-2", children: navigationItems.map((item) => {
      const isActive = currentPath === item.href;
      return /* @__PURE__ */ jsxs(
        "a",
        {
          href: item.href,
          className: `flex items-center p-3 rounded-lg mb-1 transition-colors group ${isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`,
          children: [
            /* @__PURE__ */ jsxs(
              "svg",
              {
                className: "w-5 h-5 flex-shrink-0",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                "aria-label": item.label,
                children: [
                  /* @__PURE__ */ jsx("title", { children: item.label }),
                  /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: item.icon })
                ]
              }
            ),
            !isCollapsed && /* @__PURE__ */ jsxs("div", { className: "ml-3 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium truncate", children: item.label }),
              item.description && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 truncate", children: item.description })
            ] }),
            isCollapsed && /* @__PURE__ */ jsx("div", { className: "absolute left-16 bg-slate-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50", children: item.label })
          ]
        },
        item.id
      );
    }) }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700", children: !isCollapsed ? /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "CF" }) }),
      /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Corporate Finance" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Administrator" })
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "CF" }) }) }) })
  ] });
}

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const {
    title,
    description = "Corporate Finance & Accounting Management System",
    currentPath
  } = Astro2.props;
  return renderTemplate`<html lang="en" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="description"${addAttribute(description, "content")}><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><!-- Corporate Finance Meta Tags --><meta name="application-name" content="Corporate Finance Manager"><meta name="theme-color" content="#1e293b"><!-- Security Headers --><meta http-equiv="X-Content-Type-Options" content="nosniff"><meta http-equiv="X-Frame-Options" content="DENY"><meta http-equiv="X-XSS-Protection" content="1; mode=block"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${title}</title>${renderHead()}</head> <body class="bg-slate-50 text-slate-900" data-astro-cid-sckkx6r4> <!-- Navigation Sidebar --> ${renderComponent($$result, "Navigation", Navigation, { "currentPath": currentPath, "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/components/Navigation.tsx", "client:component-export": "default", "data-astro-cid-sckkx6r4": true })} <!-- Main Content Area --> <main class="ml-64 min-h-screen transition-all duration-300" data-astro-cid-sckkx6r4> <!-- Top Header Bar --> <header class="bg-white border-b border-slate-200 px-6 py-4" data-astro-cid-sckkx6r4> <div class="flex items-center justify-between" data-astro-cid-sckkx6r4> <div data-astro-cid-sckkx6r4> <h1 class="text-xl font-semibold text-slate-800" data-astro-cid-sckkx6r4> ${title} </h1> ${description && renderTemplate`<p class="text-sm text-slate-600 mt-1" data-astro-cid-sckkx6r4> ${description} </p>`} </div> <!-- Quick Actions --> <div class="flex items-center space-x-4" data-astro-cid-sckkx6r4> <button class="text-slate-600 hover:text-slate-800 transition-colors" data-astro-cid-sckkx6r4> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-astro-cid-sckkx6r4> <title>Notifications</title> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z" data-astro-cid-sckkx6r4></path> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 0V4a2 2 0 00-2-2H9a2 2 0 00-2 2v3m1 0h4" data-astro-cid-sckkx6r4></path> </svg> </button> <button class="text-slate-600 hover:text-slate-800 transition-colors" data-astro-cid-sckkx6r4> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-astro-cid-sckkx6r4> <title>Settings</title> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" data-astro-cid-sckkx6r4></path> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" data-astro-cid-sckkx6r4></path> </svg> </button> </div> </div> </header> <!-- Page Content --> <div class="p-6" data-astro-cid-sckkx6r4> ${renderSlot($$result, $$slots["default"])} </div> </main> </body></html>`;
}, "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/layouts/Layout.astro", void 0);

export { $$Layout as $, Button as B, cn as c };
