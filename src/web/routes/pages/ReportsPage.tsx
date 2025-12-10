import React from 'react';
import { Card } from '../../components/ui/card';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
          <p className="text-slate-600 mt-1">Generate and analyze financial statements and reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Current Month</option>
            <option>Last Month</option>
            <option>Current Quarter</option>
            <option>Last Quarter</option>
            <option>Current Year</option>
            <option>Last Year</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Generate Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Financial Statements</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 ml-3">Primary Statements</h3>
          </div>
          <div className="space-y-3">
            {[
              ['Income Statement', 'Profit & Loss report'],
              ['Balance Sheet', 'Assets, liabilities & equity'],
              ['Cash Flow Statement', 'Operating, investing, financing'],
            ].map(([title, subtitle]) => (
              <button
                key={title}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{title}</p>
                    <p className="text-sm text-slate-600">{subtitle}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Management Reports</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 ml-3">Management Reports</h3>
          </div>
          <div className="space-y-3">
            {[
              ['Budget vs Actual', 'Performance analysis'],
              ['Department Performance', 'Cost center analysis'],
              ['Project Profitability', 'Track project margins'],
            ].map(([title, subtitle]) => (
              <button
                key={title}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{title}</p>
                    <p className="text-sm text-slate-600">{subtitle}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>AI Insights</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 ml-3">AI Insights</h3>
          </div>
          <div className="space-y-3">
            {[
              ['Anomaly Detection', 'AI-powered variance analysis'],
              ['Forecast Accuracy', 'Model performance tracking'],
              ['Risk Monitoring', 'Compliance and fraud signals'],
            ].map(([title, subtitle]) => (
              <button
                key={title}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{title}</p>
                    <p className="text-sm text-slate-600">{subtitle}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Report Queue</h2>
            <p className="text-sm text-slate-600">Recent and scheduled reports</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-sm text-blue-600 hover:text-blue-800">Export</button>
            <button className="text-sm text-slate-600 hover:text-slate-800">Schedule</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Report</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Period</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Generated</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['Income Statement', 'Jan 2025', 'Complete', '2m ago'],
                ['Balance Sheet', 'Q4 2024', 'Scheduled', '—'],
                ['Cash Flow', 'FY 2024', 'Processing', '45s ago'],
              ].map(([report, period, status, generated]) => (
                <tr key={report} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{report}</td>
                  <td className="py-3 px-4 text-slate-700">{period}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        status === 'Complete'
                          ? 'bg-green-100 text-green-700'
                          : status === 'Scheduled'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">{generated}</td>
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
