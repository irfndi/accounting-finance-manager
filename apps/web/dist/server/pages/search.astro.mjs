import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BkfoCJVl.mjs';
import { B as Button, $ as $$Layout } from '../chunks/Layout_D0PJoKsS.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useCallback } from 'react';
import { C as Card } from '../chunks/card_DeCDkYPE.mjs';
/* empty css                                  */
export { renderers } from '../renderers.mjs';

function DocumentSearch({ className = "" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchStats, setSearchStats] = useState(null);
  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    setSearchStats(null);
    try {
      const response = await fetch("/api/vectorize/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken") || ""}`
        },
        body: JSON.stringify({
          query: query.trim(),
          topK: 10,
          threshold: 0.7
        })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Search failed");
      }
      if (data.data) {
        setResults(data.data.results || []);
        setSearchStats({
          totalMatches: data.data.totalMatches || 0,
          processingTime: data.data.processingTime || 0
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [query]);
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };
  const formatScore = (score) => {
    return (score * 100).toFixed(1);
  };
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };
  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };
  return /* @__PURE__ */ jsx("div", { className: `document-search ${className}`, children: /* @__PURE__ */ jsx(Card, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-2", children: "Document Search" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-4", children: "Search through your documents using natural language queries" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: query,
          onChange: (e) => setQuery(e.target.value),
          onKeyDown: handleKeyPress,
          placeholder: "Search for documents... (e.g., 'invoices from last month', 'tax documents')",
          className: "flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          disabled: loading
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleSearch,
          disabled: loading || !query.trim(),
          className: "px-6",
          children: loading ? "Searching..." : "Search"
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded", children: error }),
    searchStats && /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600", children: [
      "Found ",
      searchStats.totalMatches,
      " results in ",
      searchStats.processingTime,
      "ms"
    ] }),
    results.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Search Results" }),
      results.map((result) => /* @__PURE__ */ jsx(Card, { className: "p-4 hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-medium text-gray-900", children: result.fileName || result.id }),
            result.mimeType && /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded", children: result.mimeType })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium text-green-600", children: [
              formatScore(result.similarity),
              "% match"
            ] }),
            result.uploadedAt && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: formatTimestamp(result.uploadedAt) })
          ] })
        ] }),
        result.matchedText && /* @__PURE__ */ jsx("p", { className: "text-gray-700 text-sm leading-relaxed", children: truncateText(result.matchedText) }),
        result.chunkInfo && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500", children: [
          "Chunk ",
          result.chunkInfo.chunkIndex + 1,
          " of ",
          result.chunkInfo.totalChunks
        ] })
      ] }) }, result.id))
    ] }),
    !loading && results.length === 0 && searchStats && /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-gray-500", children: [
      /* @__PURE__ */ jsx("p", { children: "No documents found matching your search." }),
      /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: "Try using different keywords or phrases." })
    ] })
  ] }) }) });
}

const $$Search = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Document Search - Finance Manager", "data-astro-cid-ipsxrsrh": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8" data-astro-cid-ipsxrsrh> ${renderComponent($$result2, "DocumentSearch", DocumentSearch, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/components/DocumentSearch.tsx", "client:component-export": "default", "data-astro-cid-ipsxrsrh": true })} </main> ` })} `;
}, "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/search.astro", void 0);

const $$file = "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/search.astro";
const $$url = "/search";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Search,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
