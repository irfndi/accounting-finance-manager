import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_BkfoCJVl.mjs';
import { B as Button, $ as $$Layout } from '../chunks/Layout_D0PJoKsS.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from '../chunks/card_DeCDkYPE.mjs';
export { renderers } from '../renderers.mjs';

class AIClient {
  baseUrl;
  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl;
  }
  /**
   * Analyze a transaction for accuracy and insights
   */
  async analyzeTransaction(transaction) {
    return this.makeRequest({
      type: "transaction-analysis",
      data: transaction
    });
  }
  /**
   * Categorize an expense automatically (legacy method)
   */
  async categorizeExpense(description, amount) {
    return this.makeRequest({
      type: "categorize-expense",
      data: { description, amount }
    });
  }
  /**
   * Generate categorization suggestion with approval workflow
   */
  async suggestCategorization(description, amount, transactionId) {
    try {
      const response = await fetch("/api/categorization/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ description, amount, transactionId })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Categorization suggestion error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Get pending categorization suggestions
   */
  async getPendingSuggestions() {
    try {
      const response = await fetch("/api/categorization/pending");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch pending suggestions:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Approve a categorization suggestion
   */
  async approveSuggestion(suggestionId) {
    try {
      const response = await fetch("/api/categorization/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ suggestionId, approved: true })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to approve suggestion:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Reject a categorization suggestion
   */
  async rejectSuggestion(suggestionId) {
    try {
      const response = await fetch("/api/categorization/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ suggestionId, approved: false })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to reject suggestion:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Get categorization history
   */
  async getCategorizationHistory() {
    try {
      const response = await fetch("/api/categorization/history");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch categorization history:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Generate financial insights from transaction data
   */
  async generateInsights(data) {
    try {
      const response = await fetch(`${this.baseUrl}/ai-insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("AI Insights Client error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Analyze a financial document (OCR + classification)
   */
  async analyzeDocument(content, type) {
    return this.makeRequest({
      type: "analyze-document",
      data: { content, type }
    });
  }
  /**
   * Detect potential fraud in transactions
   */
  async detectFraud(transaction) {
    return this.makeRequest({
      type: "fraud-detection",
      data: { transaction }
    });
  }
  /**
   * Make API request to AI analysis endpoint
   */
  async makeRequest(request) {
    try {
      const response = await fetch(`${this.baseUrl}/ai-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("AI Client error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}
const aiClient = new AIClient();

function TransactionManager() {
  const [activeTab, setActiveTab] = useState("list");
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    reference: "",
    transactionDate: /* @__PURE__ */ new Date()
  });
  const [transactionEntries, setTransactionEntries] = useState([
    { accountId: "", description: "", debitAmount: 0, creditAmount: 0 },
    { accountId: "", description: "", debitAmount: 0, creditAmount: 0 }
  ]);
  useEffect(() => {
    setAccounts([
      { id: "1", code: "1000", name: "Cash", type: "ASSET", normalBalance: "DEBIT" },
      { id: "2", code: "1100", name: "Accounts Receivable", type: "ASSET", normalBalance: "DEBIT" },
      { id: "3", code: "2000", name: "Accounts Payable", type: "LIABILITY", normalBalance: "CREDIT" },
      { id: "4", code: "3000", name: "Owner Equity", type: "EQUITY", normalBalance: "CREDIT" },
      { id: "5", code: "4000", name: "Revenue", type: "REVENUE", normalBalance: "CREDIT" },
      { id: "6", code: "5000", name: "Operating Expenses", type: "EXPENSE", normalBalance: "DEBIT" }
    ]);
    setTransactions([
      {
        id: "1",
        date: "2024-01-15",
        description: "Office Supplies Purchase",
        reference: "REF-001",
        status: "POSTED",
        entries: [
          { accountId: 6, debitAmount: 25e4, creditAmount: 0, description: "Office supplies" },
          { accountId: 1, debitAmount: 0, creditAmount: 25e4, description: "Cash payment" }
        ]
      }
    ]);
  }, []);
  const handleSmartCategorization = async (description, amount) => {
    if (!description.trim()) return;
    setAnalyzing(true);
    try {
      const response = await aiClient.suggestCategorization(description, amount);
      if (response.success && response.suggestion) {
        const { suggestedCategory, confidence, reasoning } = response.suggestion;
        setAiInsights([{
          type: "info",
          message: `AI suggests: ${suggestedCategory} (${Math.round(confidence * 100)}% confidence). Check the Categorization Manager to approve or reject this suggestion.`,
          confidence
        }]);
        if (reasoning) {
          setAiInsights((prev) => [...prev, {
            type: "info",
            message: `Reasoning: ${reasoning}`,
            confidence
          }]);
        }
      } else {
        setAiInsights([{
          type: "error",
          message: response.error || "Failed to generate categorization suggestion",
          confidence: 0
        }]);
      }
    } catch (error) {
      console.error("Smart categorization error:", error);
      setAiInsights([{
        type: "error",
        message: "Failed to connect to categorization service",
        confidence: 0
      }]);
    } finally {
      setAnalyzing(false);
    }
  };
  const handleFraudDetection = async (transaction) => {
    try {
      const response = await aiClient.detectFraud(transaction);
      if (response.success && response.result) {
        const { riskScore, flags } = response.result;
        if (riskScore > 0.7) {
          setAiInsights((prev) => [...prev, {
            type: "error",
            message: `⚠️ High fraud risk detected: ${flags?.join(", ")}`,
            confidence: riskScore
          }]);
        } else if (riskScore > 0.4) {
          setAiInsights((prev) => [...prev, {
            type: "warning",
            message: `⚠️ Moderate fraud risk: ${flags?.join(", ")}`,
            confidence: riskScore
          }]);
        }
      }
    } catch (error) {
      console.error("Fraud detection error:", error);
    }
  };
  const handleTransactionAnalysis = async () => {
    if (!newTransaction.description.trim()) return;
    setAnalyzing(true);
    try {
      const transactionData = {
        description: newTransaction.description,
        amount: transactionEntries.reduce((sum, entry) => sum + entry.debitAmount, 0),
        entries: transactionEntries.filter((e) => e.accountId && (e.debitAmount > 0 || e.creditAmount > 0)),
        date: newTransaction.transactionDate
      };
      const response = await aiClient.analyzeTransaction(transactionData);
      if (response.success && response.result) {
        const { analysis, suggestions, compliance } = response.result;
        const insights = [];
        if (analysis?.confidence > 0.8) {
          insights.push({
            type: "info",
            message: `✅ Transaction structure looks correct`,
            confidence: analysis.confidence
          });
        }
        if (suggestions?.length > 0) {
          suggestions.forEach((suggestion) => {
            insights.push({
              type: "warning",
              message: `💡 Suggestion: ${suggestion}`,
              confidence: 0.7
            });
          });
        }
        if (compliance?.issues?.length > 0) {
          compliance.issues.forEach((issue) => {
            insights.push({
              type: "error",
              message: `❌ Compliance issue: ${issue}`,
              confidence: 0.9
            });
          });
        }
        setAiInsights(insights);
        await handleFraudDetection(transactionData);
      }
    } catch (error) {
      console.error("Transaction analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };
  const addTransactionEntry = () => {
    setTransactionEntries([
      ...transactionEntries,
      { accountId: "", description: "", debitAmount: 0, creditAmount: 0 }
    ]);
  };
  const removeTransactionEntry = (index) => {
    if (transactionEntries.length > 2) {
      setTransactionEntries(transactionEntries.filter((_, i) => i !== index));
    }
  };
  const updateTransactionEntry = (index, field, value) => {
    const updated = [...transactionEntries];
    updated[index] = { ...updated[index], [field]: value };
    setTransactionEntries(updated);
  };
  const calculateTotals = () => {
    const totalDebits = transactionEntries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredits = transactionEntries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    return { totalDebits, totalCredits, isBalanced: Math.abs(totalDebits - totalCredits) < 0.01 };
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount);
  };
  const handleSubmitTransaction = async () => {
    setLoading(true);
    try {
      const totals2 = calculateTotals();
      if (!totals2.isBalanced) {
        alert("Transaction must be balanced! Total debits must equal total credits.");
        return;
      }
      if (!newTransaction.description?.trim()) {
        alert("Please enter a transaction description.");
        return;
      }
      const validEntries = transactionEntries.filter(
        (entry) => entry.accountId && (entry.debitAmount > 0 || entry.creditAmount > 0)
      );
      if (validEntries.length < 2) {
        alert("Transaction must have at least 2 entries.");
        return;
      }
      console.log("Creating transaction:", {
        description: newTransaction.description,
        reference: newTransaction.reference,
        transactionDate: newTransaction.transactionDate,
        entries: validEntries
      });
      setNewTransaction({
        description: "",
        reference: "",
        transactionDate: /* @__PURE__ */ new Date()
      });
      setTransactionEntries([
        { accountId: "", description: "", debitAmount: 0, creditAmount: 0 },
        { accountId: "", description: "", debitAmount: 0, creditAmount: 0 }
      ]);
      setAiInsights([]);
      setActiveTab("list");
      alert("Transaction created successfully!");
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Error creating transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const totals = calculateTotals();
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-800", children: "Transaction Management" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-600", children: "Create and manage financial transactions with AI assistance" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActiveTab("list"),
          className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "list" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`,
          children: "Transaction History"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActiveTab("create"),
          className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "create" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`,
          children: "New Transaction"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActiveTab("accounts"),
          className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "accounts" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`,
          children: "Chart of Accounts"
        }
      )
    ] }),
    activeTab === "list" && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Recent Transactions" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Description" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Reference" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "Amount" }),
          /* @__PURE__ */ jsx("th", { className: "text-center p-2", children: "AI Analysis" }),
          /* @__PURE__ */ jsx("th", { className: "text-center p-2", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: transactions.map((transaction) => /* @__PURE__ */ jsxs("tr", { className: "border-b hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx("td", { className: "p-2", children: transaction.date }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: transaction.description }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-sm text-gray-600", children: transaction.reference || "-" }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-xs ${transaction.status === "POSTED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`, children: transaction.status }) }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-right font-medium", children: formatCurrency(transaction.entries.reduce((sum, entry) => sum + entry.debitAmount, 0)) }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: transaction.aiAnalysis?.riskScore ? /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-xs ${transaction.aiAnalysis.riskScore > 0.7 ? "bg-red-100 text-red-800" : transaction.aiAnalysis.riskScore > 0.4 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`, children: transaction.aiAnalysis.riskScore > 0.7 ? "High Risk" : transaction.aiAnalysis.riskScore > 0.4 ? "Medium Risk" : "Low Risk" }) : /* @__PURE__ */ jsx("span", { className: "text-gray-400 text-xs", children: "Not analyzed" }) }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "View" }) })
        ] }, transaction.id)) })
      ] }) }) })
    ] }),
    activeTab === "create" && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
        "Create New Transaction",
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => handleSmartCategorization(
                newTransaction.description,
                transactionEntries.reduce((sum, entry) => sum + entry.debitAmount, 0)
              ),
              variant: "outline",
              size: "sm",
              disabled: analyzing || !newTransaction.description.trim(),
              className: "bg-blue-50 hover:bg-blue-100 text-blue-700",
              children: analyzing ? "🤖 Analyzing..." : "🤖 Smart Categorize"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: handleTransactionAnalysis,
              variant: "outline",
              size: "sm",
              disabled: analyzing || !newTransaction.description.trim(),
              className: "bg-purple-50 hover:bg-purple-100 text-purple-700",
              children: analyzing ? "🔍 Analyzing..." : "🔍 AI Analysis"
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
        aiInsights.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium text-gray-700", children: "AI Insights" }),
          aiInsights.map((insight, index) => /* @__PURE__ */ jsx("div", { className: `p-3 rounded-lg border-l-4 ${insight.type === "error" ? "bg-red-50 border-red-400 text-red-700" : insight.type === "warning" ? "bg-yellow-50 border-yellow-400 text-yellow-700" : "bg-blue-50 border-blue-400 text-blue-700"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm", children: insight.message }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs opacity-75", children: [
              Math.round(insight.confidence * 100),
              "% confidence"
            ] })
          ] }) }, index)),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => setAiInsights([]),
              variant: "outline",
              size: "sm",
              className: "text-xs",
              children: "Clear Insights"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: newTransaction.description,
                onChange: (e) => setNewTransaction({ ...newTransaction, description: e.target.value }),
                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                placeholder: "Enter transaction description"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Reference" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: newTransaction.reference || "",
                onChange: (e) => setNewTransaction({ ...newTransaction, reference: e.target.value }),
                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                placeholder: "Optional reference"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Date *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: newTransaction.transactionDate?.toISOString().split("T")[0] || "",
                onChange: (e) => setNewTransaction({ ...newTransaction, transactionDate: new Date(e.target.value) }),
                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium", children: "Journal Entries" }),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: addTransactionEntry,
                variant: "outline",
                size: "sm",
                children: "+ Add Entry"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: transactionEntries.map((entry, index) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-6 gap-3 p-3 bg-gray-50 rounded-lg", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "Account" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: entry.accountId,
                  onChange: (e) => updateTransactionEntry(index, "accountId", e.target.value),
                  className: "w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Select Account" }),
                    accounts.map((account) => /* @__PURE__ */ jsxs("option", { value: account.id, children: [
                      account.code,
                      " - ",
                      account.name
                    ] }, account.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "Description" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: entry.description || "",
                  onChange: (e) => updateTransactionEntry(index, "description", e.target.value),
                  className: "w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                  placeholder: "Entry description"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "Debit" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: entry.debitAmount || "",
                  onChange: (e) => updateTransactionEntry(index, "debitAmount", parseFloat(e.target.value) || 0),
                  className: "w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                  placeholder: "0",
                  min: "0",
                  step: "0.01"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "Credit" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: entry.creditAmount || "",
                  onChange: (e) => updateTransactionEntry(index, "creditAmount", parseFloat(e.target.value) || 0),
                  className: "w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                  placeholder: "0",
                  min: "0",
                  step: "0.01"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex items-end", children: transactionEntries.length > 2 && /* @__PURE__ */ jsx(
              Button,
              {
                onClick: () => removeTransactionEntry(index),
                variant: "outline",
                size: "sm",
                className: "text-red-600 hover:text-red-700 hover:bg-red-50",
                children: "Remove"
              }
            ) })
          ] }, index)) }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 p-4 bg-blue-50 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Total Debits:" }),
              /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-blue-600", children: formatCurrency(totals.totalDebits) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Total Credits:" }),
              /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-blue-600", children: formatCurrency(totals.totalCredits) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Balance Status:" }),
              /* @__PURE__ */ jsx("div", { className: `text-lg font-bold ${totals.isBalanced ? "text-green-600" : "text-red-600"}`, children: totals.isBalanced ? "✓ Balanced" : "✗ Unbalanced" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: handleSubmitTransaction,
                disabled: !totals.isBalanced || loading,
                className: "bg-green-600 hover:bg-green-700 disabled:bg-gray-400",
                children: loading ? "Creating..." : "Create Transaction"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: () => setActiveTab("list"),
                variant: "outline",
                children: "Cancel"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    activeTab === "accounts" && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
        "Chart of Accounts",
        /* @__PURE__ */ jsx(Button, { variant: "outline", children: "+ Add Account" })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Code" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Account Name" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Normal Balance" }),
          /* @__PURE__ */ jsx("th", { className: "text-center p-2", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: accounts.map((account) => /* @__PURE__ */ jsxs("tr", { className: "border-b hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx("td", { className: "p-2 font-mono", children: account.code }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: account.name }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-xs ${account.type === "ASSET" ? "bg-blue-100 text-blue-800" : account.type === "LIABILITY" ? "bg-red-100 text-red-800" : account.type === "EQUITY" ? "bg-purple-100 text-purple-800" : account.type === "REVENUE" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`, children: account.type }) }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: account.normalBalance }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "Edit" }) })
        ] }, account.id)) })
      ] }) }) })
    ] })
  ] });
}

function CategorizationManager({
  onSuggestionApproved,
  className = ""
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState(/* @__PURE__ */ new Set());
  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiClient.getPendingSuggestions();
      if (response.success && response.suggestions) {
        setSuggestions(response.suggestions);
      } else {
        setError(response.error || "Failed to load suggestions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };
  const handleApprove = async (suggestion) => {
    setProcessingIds((prev) => new Set(prev).add(suggestion.id));
    try {
      const response = await aiClient.approveSuggestion(suggestion.id);
      if (response.success) {
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
        onSuggestionApproved?.(suggestion);
        setError(null);
      } else {
        setError(response.error || "Failed to approve suggestion");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
    }
  };
  const handleReject = async (suggestion) => {
    setProcessingIds((prev) => new Set(prev).add(suggestion.id));
    try {
      const response = await aiClient.rejectSuggestion(suggestion.id);
      if (response.success) {
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
        setError(null);
      } else {
        setError(response.error || "Failed to reject suggestion");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
    }
  };
  useEffect(() => {
    loadSuggestions();
  }, []);
  const formatConfidence = (confidence) => {
    return `${Math.round(confidence * 100)}%`;
  };
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };
  if (loading && suggestions.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: `p-4 ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-8", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }),
      /* @__PURE__ */ jsx("span", { className: "ml-2 text-gray-600", children: "Loading suggestions..." })
    ] }) });
  }
  if (suggestions.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: `p-4 ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
      /* @__PURE__ */ jsx("div", { className: "text-gray-500 mb-2", children: "🎯" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "No pending categorization suggestions" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: loadSuggestions,
          className: "mt-2 text-blue-600 hover:text-blue-800 text-sm",
          children: "Refresh"
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: `p-4 ${className}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-gray-900", children: [
        "Categorization Suggestions (",
        suggestions.length,
        ")"
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: loadSuggestions,
          disabled: loading,
          className: "text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50",
          children: loading ? "Refreshing..." : "Refresh"
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-md", children: /* @__PURE__ */ jsx("p", { className: "text-red-700 text-sm", children: error }) }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: suggestions.map((suggestion) => {
      const isProcessing = processingIds.has(suggestion.id);
      return /* @__PURE__ */ jsx(
        "div",
        {
          className: "border border-gray-200 rounded-lg p-4 bg-white shadow-sm",
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-900", children: suggestion.description }),
                /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: formatAmount(suggestion.amount) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Suggested Category:" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-blue-600", children: suggestion.suggestedCategory }),
                  /* @__PURE__ */ jsx("span", { className: `text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`, children: formatConfidence(suggestion.confidence) })
                ] }),
                suggestion.reasoning && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: suggestion.reasoning })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-400", children: [
                "Created: ",
                new Date(suggestion.createdAt).toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 ml-4", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleApprove(suggestion),
                  disabled: isProcessing,
                  className: "px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed",
                  children: isProcessing ? "..." : "✓ Approve"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleReject(suggestion),
                  disabled: isProcessing,
                  className: "px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed",
                  children: isProcessing ? "..." : "✗ Reject"
                }
              )
            ] })
          ] })
        },
        suggestion.id
      );
    }) })
  ] });
}

function FinanceDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [activeModule, setActiveModule] = useState("overview");
  const [aiInsights, setAiInsights] = useState([]);
  const [financialAlerts, setFinancialAlerts] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const metrics = [
    {
      label: "Total Revenue",
      value: "$2,847,392",
      change: "+12.3%",
      trend: "up",
      aiInsight: "Revenue growth accelerating, on track to exceed Q4 targets by 8%"
    },
    {
      label: "Operating Expenses",
      value: "$1,923,847",
      change: "+5.7%",
      trend: "up",
      aiInsight: "Expense growth within acceptable range, consider optimization in office supplies"
    },
    {
      label: "Net Income",
      value: "$923,545",
      change: "+18.9%",
      trend: "up",
      aiInsight: "Strong profit margins, 15% above industry average"
    },
    {
      label: "Cash Flow",
      value: "$1,234,567",
      change: "-2.1%",
      trend: "down",
      aiInsight: "Temporary dip due to inventory investment, expected to normalize next month"
    }
  ];
  const modules = [
    { id: "overview", name: "Overview", icon: "📊", hasAI: true },
    { id: "gl", name: "General Ledger", icon: "📋", hasAI: true },
    { id: "categorization", name: "AI Categorization", icon: "🎯", hasAI: true },
    { id: "reports", name: "Financial Reports", icon: "📈", hasAI: true },
    { id: "budget", name: "Budget & Forecast", icon: "💰", hasAI: true },
    { id: "audit", name: "Audit Trail", icon: "🔍", hasAI: true },
    { id: "entities", name: "Multi-Entity", icon: "🏢", hasAI: false },
    { id: "ai-insights", name: "AI Insights", icon: "🤖", hasAI: true }
  ];
  useEffect(() => {
    loadAIInsights();
    loadFinancialAlerts();
  }, [selectedPeriod]);
  const loadAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await aiClient.generateInsights({
        period: selectedPeriod,
        metrics: metrics.map((m) => ({ label: m.label, value: m.value, change: m.change })),
        includeForecasting: true,
        includeRiskAnalysis: true
      });
      if (response.success && response.result) {
        const insights = response.result.insights.map((insight, index) => ({
          id: `insight-${index}`,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          priority: insight.priority,
          timestamp: /* @__PURE__ */ new Date()
        }));
        setAiInsights(insights);
      }
    } catch (error) {
      console.error("Error loading AI insights:", error);
    } finally {
      setLoadingInsights(false);
    }
  };
  const loadFinancialAlerts = async () => {
    try {
      const mockAlerts = [
        {
          id: "alert-1",
          type: "warning",
          message: "Q4 budget utilization at 87% with 2 months remaining",
          timestamp: /* @__PURE__ */ new Date()
        },
        {
          id: "alert-2",
          type: "info",
          message: "Monthly reconciliation completed successfully",
          timestamp: /* @__PURE__ */ new Date()
        }
      ];
      setFinancialAlerts(mockAlerts);
    } catch (error) {
      console.error("Error loading financial alerts:", error);
    }
  };
  const refreshAIInsights = () => {
    loadAIInsights();
  };
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };
  const getTypeIcon = (type) => {
    switch (type) {
      case "opportunity":
        return "💡";
      case "risk":
        return "⚠️";
      case "compliance":
        return "📋";
      case "optimization":
        return "⚡";
      default:
        return "💡";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-slate-800", children: "Corporate Finance Dashboard" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600", children: "AI-powered financial intelligence & corporate accounting" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: selectedPeriod,
            onChange: (e) => setSelectedPeriod(e.target.value),
            className: "px-3 py-2 border border-gray-300 rounded-md bg-white",
            children: [
              /* @__PURE__ */ jsx("option", { value: "current", children: "Current Month" }),
              /* @__PURE__ */ jsx("option", { value: "quarter", children: "Current Quarter" }),
              /* @__PURE__ */ jsx("option", { value: "year", children: "Current Year" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: refreshAIInsights,
            variant: "outline",
            disabled: loadingInsights,
            className: "bg-purple-50 hover:bg-purple-100 text-purple-700",
            children: loadingInsights ? "🤖 Analyzing..." : "🤖 Refresh AI"
          }
        ),
        /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Export Report" })
      ] })
    ] }),
    financialAlerts.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2", children: financialAlerts.map((alert) => /* @__PURE__ */ jsx("div", { className: `p-3 rounded-lg border-l-4 ${alert.type === "error" ? "bg-red-50 border-red-400 text-red-700" : alert.type === "warning" ? "bg-yellow-50 border-yellow-400 text-yellow-700" : "bg-blue-50 border-blue-400 text-blue-700"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm", children: alert.message }),
      /* @__PURE__ */ jsx("span", { className: "text-xs opacity-75", children: alert.timestamp.toLocaleTimeString() })
    ] }) }, alert.id)) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4", children: modules.map((module) => /* @__PURE__ */ jsx(
      Card,
      {
        className: `cursor-pointer transition-all hover:shadow-md ${activeModule === module.id ? "ring-2 ring-blue-500 bg-blue-50" : ""}`,
        onClick: () => setActiveModule(module.id),
        children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 text-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-2xl mb-2", children: [
            module.icon,
            module.hasAI && /* @__PURE__ */ jsx("span", { className: "text-xs ml-1", children: "🤖" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: module.name })
        ] })
      },
      module.id
    )) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: metrics.map((metric) => /* @__PURE__ */ jsx(Card, { className: "relative overflow-hidden", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-600", children: metric.label }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-slate-900", children: metric.value })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `text-sm font-medium ${metric.trend === "up" ? "text-green-600" : metric.trend === "down" ? "text-red-600" : "text-slate-600"}`, children: metric.change })
      ] }),
      metric.aiInsight && showAIPanel && /* @__PURE__ */ jsx("div", { className: "mt-3 p-2 bg-purple-50 rounded-md border-l-2 border-purple-300", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs", children: "🤖" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-purple-700 leading-relaxed", children: metric.aiInsight })
      ] }) })
    ] }) }, metric.label)) }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(
      Button,
      {
        onClick: () => setShowAIPanel(!showAIPanel),
        variant: "outline",
        size: "sm",
        className: showAIPanel ? "bg-purple-100 text-purple-700" : "",
        children: showAIPanel ? "Hide AI Insights" : "Show AI Insights"
      }
    ) }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
        modules.find((m) => m.id === activeModule)?.name || "Overview",
        modules.find((m) => m.id === activeModule)?.hasAI && /* @__PURE__ */ jsx("span", { className: "text-sm text-purple-600 font-normal", children: "AI-Enhanced" })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        activeModule === "overview" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("p", { className: "text-slate-600", children: "Welcome to your AI-powered Corporate Finance Dashboard. Get intelligent insights and automated analysis." }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-4 bg-blue-50 rounded-lg", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-semibold text-blue-900 flex items-center gap-2", children: "📊 Recent Activity" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-blue-700", children: "5 journal entries pending approval" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-blue-700", children: "3 AI-flagged transactions for review" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 bg-green-50 rounded-lg", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-semibold text-green-900 flex items-center gap-2", children: "✅ Compliance Status" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-green-700", children: "All reports up to date" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-green-700", children: "AI compliance check: 98% score" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Quick Actions" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setActiveModule("gl"), children: "📝 New Transaction" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setActiveModule("reports"), children: "📊 Generate Report" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setActiveModule("ai-insights"), children: "🤖 AI Analysis" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setActiveModule("budget"), children: "💰 Budget Review" })
            ] })
          ] })
        ] }),
        activeModule === "gl" && /* @__PURE__ */ jsx(TransactionManager, {}),
        activeModule === "categorization" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "AI Transaction Categorization" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600", children: "Review and approve AI-suggested transaction categories" })
          ] }),
          /* @__PURE__ */ jsx(
            CategorizationManager,
            {
              onSuggestionApproved: (suggestion) => {
                console.log("Suggestion approved:", suggestion);
              },
              className: "bg-white rounded-lg shadow-sm"
            }
          )
        ] }),
        activeModule === "ai-insights" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "AI Financial Insights" }),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: refreshAIInsights,
                variant: "outline",
                size: "sm",
                disabled: loadingInsights,
                children: loadingInsights ? "Refreshing..." : "Refresh"
              }
            )
          ] }),
          loadingInsights ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center p-8", children: [
            /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" }),
            /* @__PURE__ */ jsx("span", { className: "ml-2 text-gray-600", children: "AI is analyzing your financial data..." })
          ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: aiInsights.map((insight) => /* @__PURE__ */ jsx(Card, { className: "border-l-4 border-purple-400", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-lg", children: getTypeIcon(insight.type) }),
                /* @__PURE__ */ jsx("h4", { className: "font-semibold text-gray-900", children: insight.title })
              ] }),
              /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-xs ${getPriorityColor(insight.priority)}`, children: insight.priority })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-700 mb-3", children: insight.description }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "Confidence: ",
                Math.round(insight.confidence * 100),
                "%"
              ] }),
              /* @__PURE__ */ jsx("span", { children: insight.timestamp.toLocaleDateString() })
            ] })
          ] }) }, insight.id)) }),
          aiInsights.length === 0 && !loadingInsights && /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-gray-500", children: /* @__PURE__ */ jsx("p", { children: 'No AI insights available. Click "Refresh" to generate new insights.' }) })
        ] }),
        activeModule === "reports" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("p", { className: "text-slate-600", children: "AI-Enhanced Financial Reports & Statements" }),
            /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "bg-purple-50 text-purple-700", children: "🤖 AI Report Builder" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsx(Card, { className: "p-4 hover:shadow-md cursor-pointer", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "text-2xl mb-2", children: "📊" }),
              /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "P&L Statement" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "AI insights included" })
            ] }) }),
            /* @__PURE__ */ jsx(Card, { className: "p-4 hover:shadow-md cursor-pointer", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "text-2xl mb-2", children: "🏦" }),
              /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Balance Sheet" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Real-time analysis" })
            ] }) }),
            /* @__PURE__ */ jsx(Card, { className: "p-4 hover:shadow-md cursor-pointer", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "text-2xl mb-2", children: "💰" }),
              /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Cash Flow" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Predictive modeling" })
            ] }) })
          ] })
        ] }),
        activeModule === "budget" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "AI-Powered Budget & Forecast" }),
            /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "bg-purple-50 text-purple-700", children: "🤖 Generate Forecast" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs(Card, { children: [
              /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Budget vs Actual" }) }),
              /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Revenue" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-green-600", children: "+8% vs budget" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Expenses" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-yellow-600", children: "+3% vs budget" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Net Income" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-green-600", children: "+12% vs budget" })
                ] })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs(Card, { children: [
              /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "AI Forecast" }) }),
              /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx("div", { className: "p-3 bg-blue-50 rounded-md", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-blue-700", children: "📈 Revenue projected to grow 15% next quarter" }) }),
                /* @__PURE__ */ jsx("div", { className: "p-3 bg-yellow-50 rounded-md", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-yellow-700", children: "⚠️ Monitor office expenses - trending 8% above forecast" }) })
              ] }) })
            ] })
          ] })
        ] }),
        activeModule === "audit" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "AI-Enhanced Audit Trail" }),
            /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "bg-purple-50 text-purple-700", children: "🤖 Anomaly Detection" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-slate-500", children: [
            /* @__PURE__ */ jsx("p", { children: "🔍 AI-powered transaction monitoring and audit trail coming soon..." }),
            /* @__PURE__ */ jsx("p", { className: "text-sm mt-2", children: "Features: Anomaly detection, compliance checking, automated reconciliation" })
          ] })
        ] }),
        activeModule !== "overview" && activeModule !== "gl" && activeModule !== "reports" && activeModule !== "ai-insights" && activeModule !== "budget" && activeModule !== "audit" && /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-slate-500", children: /* @__PURE__ */ jsxs("p", { children: [
          'Module "',
          modules.find((m) => m.id === activeModule)?.name,
          '" coming soon...'
        ] }) })
      ] })
    ] })
  ] });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Dashboard - Corporate Finance Manager", "description": "Financial overview and key performance metrics", "currentPath": "/" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "FinanceDashboard", FinanceDashboard, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/components/FinanceDashboard.tsx", "client:component-export": "default" })} ` })}`;
}, "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/index.astro", void 0);

const $$file = "/Users/irfandi/Coding/2025/finance-manager/apps/web/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
