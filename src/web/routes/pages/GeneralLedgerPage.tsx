import React from 'react';
import { Card } from '../../components/ui/card';

export default function GeneralLedgerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">General Ledger</h1>
          <p className="text-slate-600 mt-1">Manage your chart of accounts and view transaction details</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Add Account</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Accounts</p>
              <p className="text-2xl font-bold text-slate-900">247</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Accounts</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Accounts</p>
              <p className="text-2xl font-bold text-slate-900">198</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Active</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">This Month Transactions</p>
              <p className="text-2xl font-bold text-slate-900">1,247</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Transactions</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Unbalanced Entries</p>
              <p className="text-2xl font-bold text-red-600">3</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Alerts</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Chart of Accounts</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search accounts..."
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Types</option>
              <option>Assets</option>
              <option>Liabilities</option>
              <option>Equity</option>
              <option>Revenue</option>
              <option>Expenses</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Account Code</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Account Name</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Balance</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {['Cash & Cash Equivalents', 'Accounts Receivable', 'Inventory', 'Accounts Payable', 'Retained Earnings', 'Revenue - Services'].map((account, idx) => (
                <tr key={account} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-3 px-4 font-mono text-slate-700">100{idx + 1}</td>
                  <td className="py-3 px-4 text-slate-900">{account}</td>
                  <td className="py-3 px-4 text-slate-700">
                    {idx < 2
                      ? 'Asset'
                      : idx === 2
                        ? 'Asset - Inventory'
                        : idx === 3
                          ? 'Liability'
                          : idx === 4
                            ? 'Equity'
                            : 'Revenue'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {idx % 2 === 0 ? '$125,000' : '$45,200'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        idx % 3 === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {idx % 3 === 0 ? 'Active' : 'Posted'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
