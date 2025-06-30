import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { aiClient } from '../lib/ai-client';

interface NewTransactionEntry {
  accountId: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
}

interface MockTransaction {
  id: string;
  date: string;
  description: string;
  reference?: string;
  status: string;
  entries: Array<{
    accountId: number;
    debitAmount: number;
    creditAmount: number;
    description?: string;
  }>;
  aiAnalysis?: {
    riskScore?: number;
    suggestedCategory?: string;
    confidence?: number;
    flags?: string[];
  };
}

interface MockAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
}

interface AIInsight {
  type: 'info' | 'warning' | 'error';
  message: string;
  confidence: number;
}

export default function TransactionManager() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'accounts'>('list');
  const [transactions, setTransactions] = useState<MockTransaction[]>([]);
  const [accounts, setAccounts] = useState<MockAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  
  // New Transaction Form State
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    reference: '',
    transactionDate: new Date(),
  });
  
  const [transactionEntries, setTransactionEntries] = useState<NewTransactionEntry[]>([
    { accountId: '', description: '', debitAmount: 0, creditAmount: 0 },
    { accountId: '', description: '', debitAmount: 0, creditAmount: 0 }
  ]);

  // Sample data - Replace with API calls
  useEffect(() => {
    // Mock data for demonstration
    setAccounts([
      { id: '1', code: '1000', name: 'Cash', type: 'ASSET', normalBalance: 'DEBIT' },
      { id: '2', code: '1100', name: 'Accounts Receivable', type: 'ASSET', normalBalance: 'DEBIT' },
      { id: '3', code: '2000', name: 'Accounts Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
      { id: '4', code: '3000', name: 'Owner Equity', type: 'EQUITY', normalBalance: 'CREDIT' },
      { id: '5', code: '4000', name: 'Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
      { id: '6', code: '5000', name: 'Operating Expenses', type: 'EXPENSE', normalBalance: 'DEBIT' }
    ]);

    setTransactions([
      {
        id: '1',
        date: '2024-01-15',
        description: 'Office Supplies Purchase',
        reference: 'REF-001',
        status: 'POSTED',
        entries: [
          { accountId: 6, debitAmount: 250000, creditAmount: 0, description: 'Office supplies' },
          { accountId: 1, debitAmount: 0, creditAmount: 250000, description: 'Cash payment' }
        ]
      }
    ]);
  }, []);

  // AI-powered smart categorization with approval workflow
  const handleSmartCategorization = async (description: string, amount: number) => {
    if (!description.trim()) return;
    
    setAnalyzing(true);
    try {
      const response = await aiClient.suggestCategorization(description, amount);
      if (response.success && response.suggestion) {
        const { suggestedCategory, confidence, reasoning } = response.suggestion;
        
        // Show AI insight with approval workflow info
        setAiInsights([{
          type: 'info',
          message: `AI suggests: ${suggestedCategory} (${Math.round(confidence * 100)}% confidence). Check the Categorization Manager to approve or reject this suggestion.`,
          confidence
        }]);
        
        // Optional: Show additional reasoning
        if (reasoning) {
          setAiInsights(prev => [...prev, {
            type: 'info',
            message: `Reasoning: ${reasoning}`,
            confidence
          }]);
        }
      } else {
        setAiInsights([{
          type: 'error',
          message: response.error || 'Failed to generate categorization suggestion',
          confidence: 0
        }]);
      }
    } catch (error) {
      console.error('Smart categorization error:', error);
      setAiInsights([{
        type: 'error',
        message: 'Failed to connect to categorization service',
        confidence: 0
      }]);
    } finally {
      setAnalyzing(false);
    }
  };

  // AI-powered fraud detection
  const handleFraudDetection = async (transaction: any) => {
    try {
      const response = await aiClient.detectFraud(transaction);
      if (response.success && response.result) {
        const { riskScore, flags } = response.result;
        
        if (riskScore > 0.7) {
          setAiInsights(prev => [...prev, {
            type: 'error',
            message: `⚠️ High fraud risk detected: ${flags?.join(', ')}`,
            confidence: riskScore
          }]);
        } else if (riskScore > 0.4) {
          setAiInsights(prev => [...prev, {
            type: 'warning',
            message: `⚠️ Moderate fraud risk: ${flags?.join(', ')}`,
            confidence: riskScore
          }]);
        }
      }
    } catch (error) {
      console.error('Fraud detection error:', error);
    }
  };

  // AI-powered transaction analysis
  const handleTransactionAnalysis = async () => {
    if (!newTransaction.description.trim()) return;
    
    setAnalyzing(true);
    try {
      const transactionData = {
        description: newTransaction.description,
        amount: transactionEntries.reduce((sum, entry) => sum + entry.debitAmount, 0),
        entries: transactionEntries.filter(e => e.accountId && (e.debitAmount > 0 || e.creditAmount > 0)),
        date: newTransaction.transactionDate
      };
      
      const response = await aiClient.analyzeTransaction(transactionData);
      if (response.success && response.result) {
        const { analysis, suggestions, compliance } = response.result;
        
        const insights: AIInsight[] = [];
        
        if (analysis?.confidence > 0.8) {
          insights.push({
            type: 'info',
            message: `✅ Transaction structure looks correct`,
            confidence: analysis.confidence
          });
        }
        
        if (suggestions?.length > 0) {
          suggestions.forEach((suggestion: string) => {
            insights.push({
              type: 'warning',
              message: `💡 Suggestion: ${suggestion}`,
              confidence: 0.7
            });
          });
        }
        
        if (compliance?.issues?.length > 0) {
          compliance.issues.forEach((issue: string) => {
            insights.push({
              type: 'error',
              message: `❌ Compliance issue: ${issue}`,
              confidence: 0.9
            });
          });
        }
        
        setAiInsights(insights);
        
        // Also run fraud detection
        await handleFraudDetection(transactionData);
      }
    } catch (error) {
      console.error('Transaction analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const addTransactionEntry = () => {
    setTransactionEntries([
      ...transactionEntries,
      { accountId: '', description: '', debitAmount: 0, creditAmount: 0 }
    ]);
  };

  const removeTransactionEntry = (index: number) => {
    if (transactionEntries.length > 2) {
      setTransactionEntries(transactionEntries.filter((_, i) => i !== index));
    }
  };

  const updateTransactionEntry = (index: number, field: keyof NewTransactionEntry, value: string | number) => {
    const updated = [...transactionEntries];
    updated[index] = { ...updated[index], [field]: value };
    setTransactionEntries(updated);
  };

  const calculateTotals = () => {
    const totalDebits = transactionEntries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredits = transactionEntries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    return { totalDebits, totalCredits, isBalanced: Math.abs(totalDebits - totalCredits) < 0.01 };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmitTransaction = async () => {
    setLoading(true);
    try {
      const totals = calculateTotals();
      
      if (!totals.isBalanced) {
        alert('Transaction must be balanced! Total debits must equal total credits.');
        return;
      }

      if (!newTransaction.description?.trim()) {
        alert('Please enter a transaction description.');
        return;
      }

      const validEntries = transactionEntries.filter(entry => 
        entry.accountId && (entry.debitAmount > 0 || entry.creditAmount > 0)
      );

      if (validEntries.length < 2) {
        alert('Transaction must have at least 2 entries.');
        return;
      }

      // Call API to create transaction
      // console.log('Creating transaction:', {
      //   description: newTransaction.description,
      //   reference: newTransaction.reference,
      //   transactionDate: newTransaction.transactionDate,
      //   entries: validEntries
      // });
      
      // Reset form
      setNewTransaction({
        description: '',
        reference: '',
        transactionDate: new Date()
      });
      setTransactionEntries([
        { accountId: '', description: '', debitAmount: 0, creditAmount: 0 },
        { accountId: '', description: '', debitAmount: 0, creditAmount: 0 }
      ]);
      setAiInsights([]);
      
      setActiveTab('list');
      alert('Transaction created successfully!');
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Error creating transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Transaction Management</h2>
          <p className="text-slate-600">Create and manage financial transactions with AI assistance</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'list' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Transaction History
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'create' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          New Transaction
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'accounts' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Chart of Accounts
        </button>
      </div>

      {/* Transaction List Tab */}
      {activeTab === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Reference</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-center p-2">AI Analysis</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{transaction.date}</td>
                      <td className="p-2">{transaction.description}</td>
                      <td className="p-2 text-sm text-gray-600">{transaction.reference || '-'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'POSTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(transaction.entries.reduce((sum, entry) => sum + entry.debitAmount, 0))}
                      </td>
                      <td className="p-2 text-center">
                        {transaction.aiAnalysis?.riskScore ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.aiAnalysis.riskScore > 0.7 ? 'bg-red-100 text-red-800' :
                            transaction.aiAnalysis.riskScore > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {transaction.aiAnalysis.riskScore > 0.7 ? 'High Risk' :
                             transaction.aiAnalysis.riskScore > 0.4 ? 'Medium Risk' : 'Low Risk'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not analyzed</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <Button variant="outline" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Transaction Tab */}
      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Create New Transaction
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSmartCategorization(newTransaction.description, 
                    transactionEntries.reduce((sum, entry) => sum + entry.debitAmount, 0))}
                  variant="outline"
                  size="sm"
                  disabled={analyzing || !newTransaction.description.trim()}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                >
                  {analyzing ? '🤖 Analyzing...' : '🤖 Smart Categorize'}
                </Button>
                <Button
                  onClick={handleTransactionAnalysis}
                  variant="outline"
                  size="sm"
                  disabled={analyzing || !newTransaction.description.trim()}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700"
                >
                  {analyzing ? '🔍 Analyzing...' : '🔍 AI Analysis'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Insights */}
            {aiInsights.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">AI Insights</h4>
                {aiInsights.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    insight.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
                    'bg-blue-50 border-blue-400 text-blue-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{insight.message}</span>
                      <span className="text-xs text-gray-600">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() => setAiInsights([])}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Clear Insights
                </Button>
              </div>
            )}

            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter transaction description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  value={newTransaction.reference || ''}
                  onChange={(e) => setNewTransaction({...newTransaction, reference: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={newTransaction.transactionDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setNewTransaction({...newTransaction, transactionDate: new Date(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Transaction Entries */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Journal Entries</h3>
                <Button 
                  onClick={addTransactionEntry}
                  variant="outline"
                  size="sm"
                >
                  + Add Entry
                </Button>
              </div>

              <div className="space-y-3">
                {transactionEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Account</label>
                      <select
                        value={entry.accountId}
                        onChange={(e) => updateTransactionEntry(index, 'accountId', e.target.value)}
                        className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Account</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={entry.description || ''}
                        onChange={(e) => updateTransactionEntry(index, 'description', e.target.value)}
                        className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Entry description"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Debit</label>
                      <input
                        type="number"
                        value={entry.debitAmount || ''}
                        onChange={(e) => updateTransactionEntry(index, 'debitAmount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Credit</label>
                      <input
                        type="number"
                        value={entry.creditAmount || ''}
                        onChange={(e) => updateTransactionEntry(index, 'creditAmount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-end">
                      {transactionEntries.length > 2 && (
                        <Button
                          onClick={() => removeTransactionEntry(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Transaction Summary */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Debits:</span>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(totals.totalDebits)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Total Credits:</span>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(totals.totalCredits)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Balance Status:</span>
                    <div className={`text-lg font-bold ${
                      totals.isBalanced ? 'text-green-700' : 'text-red-600'
                    }`}>
                      {totals.isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmitTransaction}
                  disabled={!totals.isBalanced || loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Creating...' : 'Create Transaction'}
                </Button>
                <Button
                  onClick={() => setActiveTab('list')}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart of Accounts Tab */}
      {activeTab === 'accounts' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Chart of Accounts
              <Button variant="outline">+ Add Account</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Account Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Normal Balance</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono">{account.code}</td>
                      <td className="p-2">{account.name}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          account.type === 'ASSET' ? 'bg-blue-100 text-blue-800' :
                          account.type === 'LIABILITY' ? 'bg-red-100 text-red-800' :
                          account.type === 'EQUITY' ? 'bg-purple-100 text-purple-800' :
                          account.type === 'REVENUE' ? 'bg-green-100 text-green-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {account.type}
                        </span>
                      </td>
                      <td className="p-2">{account.normalBalance}</td>
                      <td className="p-2 text-center">
                        <Button variant="outline" size="sm">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}